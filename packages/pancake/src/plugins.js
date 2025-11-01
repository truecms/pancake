/***************************************************************************************************************************************************************
 *
 * Install and run plugins
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
// Included modules
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
const { Log, Style, Loading } = require( './log' );
const { RecommendInstallCommand } = require( './pancake' );


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Default export
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
/**
 * Check if plugins exist and install if not
 *
 * @param  {array}  plugins  - An array of plugin names
 * @param  {string} cwd      - The path to our working directory
 *
 * @return {promise object}  - Return an object listing plugins installed and plugins found
 */
module.exports.InstallPlugins = ( plugins, cwd, lockInfo = null ) => {
	const result = {
		found: [],
		installing: [],
	};

	return new Promise( ( resolve, reject ) => {

		//go through all plugins
		plugins.map( plugin => {

			try {
				if ( Fs.existsSync( Path.normalize( `${ cwd }/../node_modules/${ plugin }` ) ) ) {
					require( Path.normalize( `${ cwd }/../node_modules/${ plugin }` ) );
				}
				else {
					require( Path.normalize( `${ cwd }/node_modules/${ plugin }` ) );
				}

				result.found.push( plugin );
			}
			catch( error ) {
				result.installing.push( plugin );
			}

		});


		if( result.installing.length > 0 ) {
			Loading.stop();

			const suggestion = RecommendInstallCommand( lockInfo, result.installing );
			let message = `Missing Pancake plugins: ${ Style.yellow( result.installing.join(', ') ) }`;

			if( lockInfo ) {
				message += `\nDetected lockfile ${ Style.yellow( lockInfo.filename ) } managed by ${ Style.yellow( lockInfo.manager ) }.`;
			}
			else {
				message += `\nNo lockfile detected; unable to determine package manager automatically.`;
			}

			message += `\nInstall the missing plugins before running Pancake again.`;

			if( suggestion ) {
				message += `\nSuggested command: ${ Style.yellow( suggestion ) }`;
			}

			const error = new Error( message );
			error.code = 'PANCAKE_MISSING_PLUGINS';
			error.missingPlugins = result.installing;
			error.lockfile = lockInfo;

			reject( error );
		}
		else {
			resolve( result );
		}
	});
};


/**
 * Run a bunch of plugins
 *
 * @param  {string} version       - The version of mother pancake
 * @param  {array}  plugins       - An array of plugin names
 * @param  {string} cwd           - The path to our working directory
 * @param  {array}  allModules    - An array of all modules to be passed to plugin
 * @param  {object} SETTINGSlocal - The object of our local settings
 * @param  {object} SETTINGS      - The global settings object
 *
 * @return {promise object}       - Pass on what the plugins returned
 */
module.exports.RunPlugins = ( version, plugins, cwd, allModules, SETTINGSlocal, SETTINGS ) => {

	Loading.stop();

	let plugin;
	let running = [];

	return new Promise( ( resolve, reject ) => {

		//go through all plugins
		const allPlugins = plugins.map( plugin => {
			Log.info(`ADDING TOPPINGS TO YOUR PANCAKE VIA ${ plugin }`);

			if ( Fs.existsSync( Path.normalize( `${ cwd }/../node_modules/${ plugin }` ) ) ) {
				plugin = require( Path.normalize( `${ cwd }/../node_modules/${ plugin }` ) );
			} 
			else {
				plugin = require(Path.normalize(`${ cwd }/node_modules/${ plugin }`));
			}

			return plugin.pancake( version, allModules, SETTINGSlocal, SETTINGS, cwd ) //run ’em
				.catch( error => {
					Log.error( error );

					process.exit( 1 );
			});
		});

		Promise.all( allPlugins )
			.catch( error => {
				Log.error( error );

				process.exit( 1 );
			})
			.then( data => {
				Loading.start();

				return resolve( data ); //resolve only after all plugins have run
		});
	});


};
