/* (file content inlined) */
/***************************************************************************************************************************************************************
 *
 * Generate and compile Sass
 *
 * @repo    - https://github.com/truecms/pancake
 * @author  - Dominik Wilkowski
 * @license - https://raw.githubusercontent.com/truecms/pancake/master/LICENSE (MIT)
 *
 **************************************************************************************************************************************************************/

'use strict';


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Dependencies
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
const Autoprefixer = require( 'autoprefixer' );
const Postcss = require( 'postcss' );
const Sass = require( 'sass' );
const Path = require( 'path' );
const Fs = require( 'fs' );
const { pathToFileURL, fileURLToPath } = require( 'url' );

//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Included modules
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
const { Log, Style, WriteFile } = require( '@truecms/pancake' );

const escapeForRegExp = value => value.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );

const dedupeBannerComment = ( css, bannerComment ) => {
        if( typeof bannerComment !== 'string' || bannerComment.trim().length === 0 ) {
                return css;
        }

        const trimmed = bannerComment.trim();
        if( trimmed.length === 0 ) {
                return css;
        }

        const pattern = new RegExp( escapeForRegExp( trimmed ), 'g' );
        let matchIndex = 0;
        return css.replace( pattern, match => {
                const replacement = ( matchIndex === 0 ) ? match : '';
                matchIndex += 1;
                return replacement;
        } );
};


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Sass helpers
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
const createFileImporter = ( cwd, loadPaths = [] ) => ({
	canonicalize( url, options ) {
		if( typeof url !== 'string' ) {
			return null;
		}

		// Only handle file: URLs and absolute paths
		// Let Sass use loadPaths for everything else (including node_modules packages)
		if( url.startsWith( 'file:' ) ) {
			return new URL( url );
		}

		if( Path.isAbsolute( url ) ) {
			return pathToFileURL( url );
		}

		// Handle package imports like 'sass-versioning/dist/_index.scss'
		// Check if it looks like a package import (starts with a package name, no leading ./ or ../)
		// This handles imports from within module files that reference node_modules packages
		if( !url.startsWith( '.' ) && !url.startsWith( '/' ) && url.indexOf( '/' ) !== -1 ) {
			const parts = url.split( '/' );
			const packageName = parts[ 0 ];
			
			// Try to resolve from loadPaths (these are node_modules directories)
			for( const loadPath of loadPaths ) {
				const packagePath = Path.join( loadPath, packageName );
				if( Fs.existsSync( packagePath ) ) {
					const fullPath = Path.join( loadPath, url );
					if( Fs.existsSync( fullPath ) ) {
						const resolved = pathToFileURL( fullPath );
						Log.verbose(`Sass: Resolved package import ${ Style.yellow( url ) } to ${ Style.yellow( fullPath ) }`);
						return resolved;
					}
				}
			}
		}

		// Return null for all other imports to let Sass use loadPaths
		// Sass will try loadPaths automatically for package-like imports
		return null;
	},
	load( canonicalUrl ) {
		const filePath = fileURLToPath( canonicalUrl );
		const contents = Fs.readFileSync( filePath, 'utf8' );

		return {
			contents,
			syntax: 'scss',
			sourceMapUrl: canonicalUrl,
		};
	},
});

const resolveBrowserslist = settings => {
	if( !settings || typeof settings !== 'object' ) {
		return null;
	}

	if( Array.isArray( settings.browserslist ) && settings.browserslist.length > 0 ) {
		return settings.browserslist;
	}

	if( Array.isArray( settings.browsers ) && settings.browsers.length > 0 ) {
		return settings.browsers;
	}

	return null;
};


const dedupeBannerPlugin = () => {
	return {
		postcssPlugin: 'pancake-dedupe-banner',
		Once( root ) {
			let seenBanner = false;
			root.walkComments( comment => {
				const text = comment.text || '';
				if( !text.startsWith('! PANCAKE v') ) {
					return;
				}

				if( seenBanner ) {
					comment.remove();
				}
				else {
					seenBanner = true;
				}
			} );
		},
	};
};
dedupeBannerPlugin.postcss = true;


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Default export
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
/**
 * Get the include path for a sass partial
 *
 * @param  {string} module       - The module name
 * @param  {object} modules      - An object of all modules and their settings
 * @param  {string} baseLocation - The current base path
 * @param  {string} npmOrg       - The npm org scope
 *
 * @return {string}              - The path to the sass partial
 */
const GetPath = ( module, modules, baseLocation, npmOrg ) => {
	let modulePath = '';

	for( const item of modules ) {
		if( item.name === module ) {
			if( item.pancake['pancake-module'].sass.path ) {
				const sassPath = item.pancake['pancake-module'].sass.path.replace(/\\/g, '/' );

				if( module.startsWith( '@' ) ) {
					modulePath = Path.posix.join( module, sassPath );
				}
				else {
					const npmOrgs = npmOrg.split( ' ' );
					let locationBase = baseLocation;

					npmOrgs.forEach( org => {
						if( baseLocation.includes( org ) ){
							locationBase = baseLocation.replace( `${ org }${ Path.sep }`, '' );
						}
					});

					modulePath = Path.normalize(`${ locationBase }/${ module }/${ item.pancake['pancake-module'].sass.path }`);
				}
			}
			else {
				modulePath = false;
			}

			break;
		}
	}

	return modulePath;
}


/**
 * Look up all dependencies of a module by calling yourself
 *
 * @param  {string}  module    - The name of the module
 * @param  {object}  modules   - All modules in an object array
 * @param  {string}  parent    - The name of the parent module, Defaults to the module argument
 * @param  {integer} iteration - The depth of the iteration, defaults to 1
 *
 * @return {object}            - An object array of the dependencies that are needed for the module
 */
const GetDependencies = ( module, modules, parent = module, iteration = 1 ) => {
	Log.verbose(`Sass: Looking up dependencies at level ${ Style.yellow( iteration ) }`);

	let allDependencies = {};

	if( iteration > 50 ) {
		Log.error(`Sass: Looks like we found a circular dependency that seems to go no-where from ${ Style.yellow( parent ) }.`);
	}
	else {

		for( const item of modules ) {
			if( item.name === module ) {
				if( item.peerDependencies ) {
					for( const subDependency of Object.keys( item.peerDependencies ) ) {
						const subDependencies = GetDependencies( subDependency, modules, parent, ( iteration + 1 ) );

						allDependencies = Object.assign( allDependencies, subDependencies );
					}
				}

				allDependencies = Object.assign( allDependencies, item.peerDependencies );

				break;
			}
		}

	}

	return allDependencies;
};


/**
 * Generate Sass code for a module and it's dependencies
 *
 * @param  {string} location - The location of the module to be compiled
 * @param  {object} name     - The name of the module
 * @param  {object} modules  - All modules and their dependencies
 * @param  {object} npmOrg   - The name of the npm org scope
 *
 * @return {string}          - Sass code to tie dependencies and module together
 */
module.exports.GenerateSass = ( location, name, modules, npmOrg ) => {
	let sass = ``; //the code goes here

	const baseLocation = Path.normalize(`${ location }/../`);
	const dependencies = GetDependencies( name, modules );

	Log.verbose(`Sass: For ${ Style.yellow( name ) } we found the following dependencies ${ Style.yellow( JSON.stringify( dependencies ) ) }`);

	if( dependencies ) {
		for( const dependency of Object.keys( dependencies ) ) {
			const modulePath = GetPath( dependency, modules, baseLocation, npmOrg );

			if( modulePath ) {
				sass += `@use "${ modulePath }" as *;\n`;
			}
		}
	}

	const modulePath = GetPath( name, modules, baseLocation, npmOrg );
	sass += `@use "${ modulePath }" as *;\n`;

	return sass.replace(/\\/g, "\\\\"); // escape path for silly windows
};


/**
 * Compile Sass, autoprefix it and save it to disk
 *
 * @param  {string} location - The path we want to save the compiled css to
 * @param  {object} settings - The SettingsCSS object
 * @param  {string} sass     - The Sass to be compiled
 * @param  {string} cwd     - The current working directory for resolving node_modules
 *
 * @return {promise object}  - Boolean true for 👍 || string error for 👎
 */
module.exports.Sassify = async ( location, settings, sass, cwd ) => {
	try {
		const shouldWriteSourceMap = Boolean( settings.sourcemap );
		
		// Build loadPaths for node_modules resolution
		// Walk up the directory tree to find all node_modules directories
		const loadPaths = [];
		if( cwd ) {
			let currentDir = Path.resolve( cwd );
			const visited = new Set();
			
			// Walk up to find all node_modules directories (for nested dependencies)
			for( let i = 0; i < 10; i++ ) {
				const nodeModulesDir = Path.join( currentDir, 'node_modules' );
				if( Fs.existsSync( nodeModulesDir ) && !visited.has( nodeModulesDir ) ) {
					loadPaths.push( nodeModulesDir );
					visited.add( nodeModulesDir );
				}
				
				const parentDir = Path.dirname( currentDir );
				if( parentDir === currentDir ) {
					break; // Reached root
				}
				currentDir = parentDir;
			}
		}
		
		const compileOptions = {
			style: settings.minified ? 'compressed' : 'expanded',
			importers: [ createFileImporter( cwd, loadPaths ) ],
			loadPaths: loadPaths,
			quietDeps: true,
			silenceDeprecations: [ 'import', 'global-builtin' ], // Silence deprecation warnings
		};

		if( shouldWriteSourceMap ) {
			compileOptions.sourceMap = true;
			compileOptions.sourceMapIncludeSources = true;
		}

		const generated = await Sass.compileStringAsync( sass, compileOptions );

		Log.verbose(`Sass: Successfully compiled Sass for ${ Style.yellow( location ) }`);

		const postcssOptions = {
			from: location,
			to: location,
		};

		if( shouldWriteSourceMap && generated.sourceMap ) {
			const previousMap = typeof generated.sourceMap === 'string'
				? generated.sourceMap
				: JSON.stringify( generated.sourceMap ); // dart-sass returns a plain object when sourcemaps are enabled

			postcssOptions.map = {
				prev: previousMap,
				inline: false,
				annotation: false,
				sourcesContent: true,
			};
		}
		else {
			postcssOptions.map = false;
		}

		const browserslist = resolveBrowserslist( settings );
		const autoprefixerPlugin = browserslist
			? Autoprefixer({ overrideBrowserslist: browserslist })
			: Autoprefixer();
		const prefixed = await Postcss([
			autoprefixerPlugin,
			dedupeBannerPlugin(),
		]).process( generated.css, postcssOptions );

		prefixed
			.warnings()
			.forEach( warn => Log.error( warn.toString() ) );

		Log.verbose(`Sass: Successfully autoprefixed CSS for ${ Style.yellow( location ) }`);

                const outputCss = dedupeBannerComment( prefixed.css, settings && settings.bannerComment );

                await WriteFile( location, outputCss );

		if( shouldWriteSourceMap && prefixed.map ) {
			const mapLocation = `${ location }.map`;
			await WriteFile( mapLocation, prefixed.map.toString() );
			Log.verbose(`Sass: Wrote sourcemap for ${ Style.yellow( location ) } to ${ Style.yellow( mapLocation ) }`);
		}

		return true;
	}
	catch( error ) {
		Log.error(`Sass compile failed for ${ Style.yellow( location ) }`);

		throw ( error && error.message ) ? error.message : error;
	}
};

module.exports.GetDependencies = GetDependencies;
module.exports.GetPath = GetPath;
