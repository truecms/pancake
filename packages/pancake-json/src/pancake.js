/***************************************************************************************************************************************************************
 *
 * Plug-in for Pancake
 *
 * Generate a json file from all pancake modules.
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
const Path = require( 'path' );
const Fs = require( 'fs' );


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Module imports
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
const { Log, Style, Loading, ReadFile, WriteFile } = require( '@gov.au/pancake' );

const SCHEMA_VERSION = '1.0.0';

const getPackageVersion = ( name, basePaths ) => {
	for( const basePath of basePaths ) {
		try {
			const packageJson = require( Path.join( basePath, 'node_modules', name, 'package.json' ) );
			return packageJson.version;
		}
		catch( error ) {
			// ignore resolution errors and fall back to next candidate path
		}
	}

	try {
		return require( `${ name }/package.json` ).version;
	}
	catch( error ) {
		return null;
	}
};

Log.output = true; //this plugin assumes you run it through pancake


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Plugin export
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
/**
 * The main pancake method for this plugin
 *
 * @param  {array}  version        - The version of mother pancake
 * @param  {array}  modules        - An array of all module objects
 * @param  {object} settings       - An object of the host package.json file and it’s path
 * @param  {object} GlobalSettings - An object of the global settings
 * @param  {object} cwd            - The path to the working directory of our host package.json file
 *
 * @return {Promise object}  - Returns an object of the settings we want to save
 */
module.exports.pancake = ( version, modules, settings, GlobalSettings, cwd ) => {
	Loading.start( 'pancake-json', Log.verboseMode );


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Settings
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
	let SETTINGS = {
		json: {
			enable: false,
			location: 'pancake/',
			name: 'pancake',
			content: {
				name: true,
				version: true,
				dependencies: true,
				path: true,
				settings: true,
			},
		},
	};

	//merging settings with host settings
	Object.assign( SETTINGS.json, settings.json );

	if( typeof settings.json === 'undefined' ) {
		settings.json = {};
	}

	Object.assign( SETTINGS.json.content, settings.json.content );


	return new Promise( ( resolve, reject ) => {
		//some housekeeping
		if( typeof version !== 'string' ) {
			reject(
				`Plugin pancake-json got a mismatch for the data that was passed to it! ${ Style.yellow(`version`) } was ${ Style.yellow( typeof version ) } ` +
				`but should have been ${ Style.yellow(`string`) }`
			);
		}

		if( typeof modules !== 'object' ) {
			reject(
				`Plugin pancake-json got a mismatch for the data that was passed to it! ${ Style.yellow(`modules`) } was ${ Style.yellow( typeof modules ) } ` +
				`but should have been ${ Style.yellow(`object`) }`
			);
		}

		if( typeof settings !== 'object' ) {
			reject(
				`Plugin pancake-json got a mismatch for the data that was passed to it! ${ Style.yellow(`settings`) } was ${ Style.yellow( typeof settings ) } ` +
				`but should have been ${ Style.yellow(`object`) }`
			);
		}

		if( typeof cwd !== 'string' ) {
			reject(
				`Plugin pancake-json got a mismatch for the data that was passed to it! ${ Style.yellow(`cwd`) } was ${ Style.yellow( typeof cwd ) } ` +
				`but should have been ${ Style.yellow(`string`) }`
			);
		}


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Promise loop
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
	const JSONOutput = {};
	const discoveredPlugins = new Set();


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Iterate over each module
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
		if( SETTINGS.json.enable ) {
			for( const modulePackage of modules ) {
				Log.verbose(`JSON: Building ${ Style.yellow( modulePackage.name ) }`);

				JSONOutput[ modulePackage.name ] = {};

				const moduleSettings = modulePackage.pancake && modulePackage.pancake['pancake-module'];
				if( moduleSettings && Array.isArray( moduleSettings.plugins ) ) {
					for( const pluginName of moduleSettings.plugins ) {
						discoveredPlugins.add( pluginName );
					}
				}

				if( SETTINGS.json.content.name ) {
					JSONOutput[ modulePackage.name ].name = modulePackage.name;
				}

				if( SETTINGS.json.content.version ) {
					JSONOutput[ modulePackage.name ].version = modulePackage.version;
				}

				if( SETTINGS.json.content.dependencies ) {
					JSONOutput[ modulePackage.name ].dependencies = modulePackage.peerDependencies;
				}

				if( SETTINGS.json.content.path ) {
					JSONOutput[ modulePackage.name ].path = modulePackage.path;
				}

				if( SETTINGS.json.content.settings ) {
					JSONOutput[ modulePackage.name ].settings = modulePackage.pancake['pancake-module'];
				}
			}

			discoveredPlugins.add( '@gov.au/pancake-json' );
			discoveredPlugins.add( '@gov.au/pancake' );

			if( Object.keys( JSONOutput ).length > 0 ) {
				const jsonPath = Path.normalize(`${ cwd }/${ SETTINGS.json.location }/${ SETTINGS.json.name }.json`);
				const basePaths = [ cwd, Path.resolve( cwd, '..' ), __dirname, Path.resolve( __dirname, '..' ) ];
				const pluginVersions = {};

				for( const pluginName of discoveredPlugins ) {
					const pluginVersion = getPackageVersion( pluginName, basePaths );

					if( pluginVersion ) {
						pluginVersions[ pluginName ] = pluginVersion;
					}
				}

				JSONOutput._meta = {
					schemaVersion: SCHEMA_VERSION,
					pancakeVersion: version,
					plugins: pluginVersions,
				};

				WriteFile( jsonPath, JSON.stringify( JSONOutput ) ) //write the generated content to file and return its promise
					.catch( error => {
						Log.error( error );

						reject( error );
					})
					.then( () => {
						Log.ok('JSON PLUGIN FINISHED');
						Loading.stop( 'pancake-json', Log.verboseMode ); //stop loading animation

						resolve( SETTINGS );
				});
			}
			else {
				Loading.stop( 'pancake-json', Log.verboseMode ); //stop loading animation

				Log.info(`No pancake modules found 😬`);
				resolve( SETTINGS );
			}
		}
		else {
			Log.ok('JSON PLUGIN DISABLED');
			Loading.stop( 'pancake-json', Log.verboseMode ); //stop loading animation

			resolve( SETTINGS );
		}
	});
}
