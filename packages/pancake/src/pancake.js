#!/usr/bin/env node

/***************************************************************************************************************************************************************
 *
 * Checking peerDependencies for conflicts
 * This tool was built to make working with npm and the front end easy and seamless.
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
const Path = require( 'path' );
const Fs = require( 'fs' );


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Using this file to export the reusable items
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
const { GetFolders, CreateDir, WriteFile, ReadFile, CopyFile } = require('./files' );
const { ExitHandler, CheckNPM, Cwd, Size, Spawning } = require('./helpers' );
const { Log, Style, Loading } = require('./log' );
const { ParseArgs } = require('./parse-arguments' );
const { CheckModules } = require( './conflicts' );
const { GetModules } = require( './modules' );
const { Settings } = require( './settings' );
const Semver = require( './semver-5-3-0' );


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Lockfile discovery helpers
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
const LOCKFILE_CANDIDATES = [
	{ filename: 'pnpm-lock.yaml', manager: 'pnpm' },
	{ filename: 'package-lock.json', manager: 'npm' },
];

const ResolveLockfile = ( cwd = process.cwd() ) => {
	if( typeof cwd !== 'string' || cwd.length === 0 ) {
		return null;
	}

	const basePath = Path.resolve( cwd );

	for( const candidate of LOCKFILE_CANDIDATES ) {
		const candidatePath = Path.join( basePath, candidate.filename );

		if( Fs.existsSync( candidatePath ) ) {
			return {
				manager: candidate.manager,
				path: candidatePath,
				filename: candidate.filename,
			};
		}
	}

	return null;
};

const RecommendInstallCommand = ( lockInfo, packages = [] ) => {
	if( !Array.isArray( packages ) || packages.length === 0 ) {
		return '';
	}

	const packageList = packages.join( ' ' );

	if( lockInfo && lockInfo.manager === 'pnpm' ) {
		return `pnpm add ${ packageList }`;
	}

	if( lockInfo && lockInfo.manager === 'npm' ) {
		return `npm install ${ packageList } --save`;
	}

	return `npm install ${ packageList } --save`;
};


module.exports = { //here, take a sword; for you may need it
	ExitHandler,
	CheckNPM,
	Cwd,
	Size,
	Spawning,
	Log,
	Style,
	Loading,
	ParseArgs,
	CheckModules,
	GetModules,
	Settings,
	GetFolders,
	CreateDir,
	WriteFile,
	ReadFile,
	CopyFile,
	Semver,
	ResolveLockfile,
	RecommendInstallCommand,
};


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Get batter object
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
/**
 * Running all the important bits to get us the data we need to run Pancake programmatically
 *
 * @param  {array} argv     - The arguments passed to node
 *
 * @return {Promise object} - The data object of the pancake modules
 */
module.exports.Batter = ( argv = process.argv ) => {
	const pkg = require( Path.normalize(`${ __dirname }/../package.json`) );

	// Check npm version
	const npmVersion = CheckNPM();

	//npm 3 and higher is required as below will install dependencies inside each module folder
	if( !npmVersion ) {
		Log.error(`Pancake only works with npm 3 and later.`);
		Log.space();
		process.exit( 1 );
	}

	// Get global settings
	let SETTINGS = Settings.GetGlobal();

	// Parsing cli arguments
	const ARGS = ParseArgs( SETTINGS, argv );

	//arg overwrites
	SETTINGS.npmOrg = ARGS.org;
	SETTINGS.plugins = ARGS.plugins;
	SETTINGS.ignorePlugins = ARGS.ignorePlugins;

	// Finding the current working directory
	const pkgPath = Cwd( ARGS.cwd );
	const lockfile = ResolveLockfile( pkgPath );

	if( lockfile ) {
		Log.verbose(`Detected lockfile ${ Style.yellow( lockfile.filename ) } for ${ Style.yellow( lockfile.manager ) } in ${ Style.yellow( pkgPath ) }`);
	}
	else {
		Log.verbose(`No lockfile detected in ${ Style.yellow( pkgPath ) }`);
	}

	// Get local settings
	let SETTINGSlocal = Settings.GetLocal( pkgPath );

	// Get all modules data
	return new Promise( ( resolve, reject ) => {

GetModules( pkgPath, SETTINGS.npmOrg )
		.catch( error => {
			reject(`Reading all package.json files bumped into an error: ${ error }`);
			reject( error );
		})
		.then( allModules => { //once we got all the content from all package.json files
				Log.verbose(`Gathered all modules:\n${ Style.yellow( JSON.stringify( allModules ) ) }`);

				if( allModules.length > 0 ) {
					const conflicts = CheckModules( allModules ); //check for conflicts

					if( conflicts.conflicts ) {
						reject( conflicts );
					}
					else {
					resolve({
						version: pkg.version,
						modules: allModules,
						settings: SETTINGSlocal,
						globalSettings: SETTINGS,
						cwd: pkgPath,
						lockfile: lockfile,
					});
				}
			}
			else {
				resolve({
					version: pkg.version,
					modules: allModules,
					settings: SETTINGSlocal,
					globalSettings: SETTINGS,
					cwd: pkgPath,
					lockfile: lockfile,
				});
			}
	});

	});
}
