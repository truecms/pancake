/***************************************************************************************************************************************************************
 *
 * Generate and compile JS
 *
 * @repo    - https://github.com/govau/pancake
 * @author  - Dominik Wilkowski
 * @license - https://raw.githubusercontent.com/govau/pancake/master/LICENSE (MIT)
 *
 **************************************************************************************************************************************************************/

'use strict';


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Dependencies
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
const Esbuild = require( 'esbuild' );
const Path = require( 'path' );


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Included modules
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
const { Log, Style, ReadFile, WriteFile } = require( '@truecms/pancake' );


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Helpers
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
const DEFAULT_TARGET = [ 'es2019' ];

const toEsmPath = filePath => {
	if( typeof filePath !== 'string' ) {
		return filePath;
	}

	if( filePath.endsWith( '.mjs' ) ) {
		return filePath;
	}

	if( filePath.endsWith( '.js' ) ) {
		return filePath.replace( /\.js$/, '.mjs' );
	}

	return `${ filePath }.mjs`;
};

const stripSourceMappingURL = code => {
	if( typeof code !== 'string' ) {
		return '';
	}

	return code.replace( /\s*\/\/# sourceMappingURL=.*?$/u, '' ).trimEnd();
};

const buildOutput = async ({
	source,
	format,
	minify,
	sourcemap,
	sourcefile,
	outfile,
	banner,
	legalComments = 'inline',
}) => {
	try {
		const result = await Esbuild.build({
			stdin: {
				contents: source,
				loader: 'js',
				sourcefile,
				resolveDir: Path.dirname( sourcefile ),
			},
			write: false,
			bundle: false,
			minify: Boolean( minify ),
			sourcemap: sourcemap ? 'linked' : false,
			format,
			target: DEFAULT_TARGET,
			platform: 'browser',
			legalComments,
			banner: banner ? { js: banner } : undefined,
			outfile,
		});

		const jsFile = result.outputFiles.find( file => /\.(?:cjs|mjs|js)$/.test( file.path ) );
		const mapFile = result.outputFiles.find( file => file.path.endsWith( '.map' ) );

		return {
			code: jsFile ? jsFile.text : '',
			map: mapFile ? mapFile.text : null,
			codeWithoutSourceMap: jsFile ? stripSourceMappingURL( jsFile.text ) : '',
		};
	}
	catch( error ) {
		Log.error(`Unable to build js code for ${ Style.yellow( sourcefile ) }`);
		Log.error( error.message || error );

		throw error;
	}
};

const writeArtifact = async ( filePath, output, sourcemapEnabled ) => {
	await WriteFile( filePath, output.code );

	if( sourcemapEnabled && output.map ) {
		await WriteFile( `${ filePath }.map`, output.map );
	}
};


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Default export
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
/**
 * Minify JS so we have one function not several
 *
 * @param  {string} js   - The JS code to be minified
 * @param  {string} file - The file name for error reporting
 *
 * @return {string}      - The minified js code
 */
const MinifyJS = ( js, file ) => {
	try {
		const jsCode = Esbuild.transformSync( js, {
			loader: 'js',
			minify: true,
			format: 'cjs',
			sourcefile: file,
			sourcemap: false,
			target: DEFAULT_TARGET,
			legalComments: 'none',
		});

		return jsCode.code;
	}
	catch( error ) {
		Log.error(`Unable to minify js code for ${ Style.yellow( file ) }`);
		Log.error( error.message || error );

		return js;
	}
};


/**
 * Get js from module, minify depending on settings and write to disk
 *
 * @param  {string} from     - Where is the module so we can read from there
 * @param  {object} settings - The SettingsJS object
 * @param  {string} to       - Where shall we write the module to if settings allow?
 * @param  {string} tag      - The tag to be added to the top of the file
 *
 * @return {promise object}  - The js code either minified or bare bone
 */
module.exports.HandleJS = async ( from, settings, to, tag ) => {
	let source;

	try {
		source = await ReadFile( from );
	}
	catch( error ) {
		Log.error(`Unable to read file ${ Style.yellow( from ) }`);
		Log.error( error );

		throw error;
	}

	const sourcemapEnabled = Boolean( settings.sourcemap );
	const minify = Boolean( settings.minified );
	const esmPath = toEsmPath( to );
	const banner = `/*! ${ tag } */`;

	const [ cjsOutput, esmOutput ] = await Promise.all([
		buildOutput({
			source,
			format: 'cjs',
			minify,
			sourcemap: sourcemapEnabled,
			sourcefile: from,
			outfile: Path.basename( to ),
			banner,
		}),
		buildOutput({
			source,
			format: 'esm',
			minify,
			sourcemap: sourcemapEnabled,
			sourcefile: from,
			outfile: Path.basename( esmPath ),
			banner,
		}),
	]);

	if( settings.modules ) {
		await Promise.all([
			writeArtifact( to, cjsOutput, sourcemapEnabled ),
			writeArtifact( esmPath, esmOutput, sourcemapEnabled ),
		]);

		Log.verbose(`JS: Wrote module outputs for ${ Style.yellow( from ) }`);
	}

	return {
		tag,
		from,
		source,
		cjs: cjsOutput,
		esm: esmOutput,
	};
};


/**
 * Minify all js modules together once their promises have resolved
 *
 * @param  {array}  version        - The version of mother pancake
 * @param  {array}  moduleOutputs  - An array of module build results
 * @param  {object} settings       - The SettingsJS object
 * @param  {string} pkgPath        - The path to the current working directory
 *
 * @return {promise object}        - Returns true once the promise is resolved
 */
module.exports.MinifyAllJS = async ( version, moduleOutputs, settings, pkgPath ) => {
	const Package = require( Path.normalize(`${ __dirname }/../package.json`) );
	const sourcemapEnabled = Boolean( settings.sourcemap );
	const minify = Boolean( settings.minified );
	const locationJS = Path.normalize(`${ pkgPath }/${ settings.location }/${ settings.name }`);
	const esmLocation = toEsmPath( locationJS );
	const header = `/* PANCAKE v${ version } PANCAKE-JS v${ Package.version } */`;
	const outputs = ( moduleOutputs || [] ).filter( Boolean );

	const cjsSource = outputs
		.map( output => output.cjs.codeWithoutSourceMap || output.cjs.code )
		.join( '\n' );

	const esmSource = outputs
		.map( output => output.esm.codeWithoutSourceMap || output.esm.code )
		.join( '\n' );

	const [ cjsOutput, esmOutput ] = await Promise.all([
		buildOutput({
			source: cjsSource,
			format: 'cjs',
			minify,
			sourcemap: sourcemapEnabled,
			sourcefile: settings.name,
			outfile: Path.basename( locationJS ),
			banner: header,
		}),
		buildOutput({
			source: esmSource,
			format: 'esm',
			minify,
			sourcemap: sourcemapEnabled,
			sourcefile: Path.basename( esmLocation ),
			outfile: Path.basename( esmLocation ),
			banner: header,
		}),
	]);

	await Promise.all([
		writeArtifact( locationJS, cjsOutput, sourcemapEnabled ),
		writeArtifact( esmLocation, esmOutput, sourcemapEnabled ),
	]);

	Log.verbose(`JS: Wrote aggregated bundles to ${ Style.yellow( locationJS ) }`);

	return true;
};

module.exports.MinifyJS = MinifyJS;
