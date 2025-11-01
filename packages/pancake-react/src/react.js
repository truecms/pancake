/***************************************************************************************************************************************************************
 *
 * Move react files
 *
 * @repo    - https://github.com/govau/pancake
 * @author  - Dominik Wilkowski and Alex Page
 * @license - https://raw.githubusercontent.com/govau/pancake/master/LICENSE (MIT)
 *
 **************************************************************************************************************************************************************/

'use strict';


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Included modules
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
const Fs = require( 'fs' );
const Path = require( 'path' );

const { Log, Style, ReadFile, WriteFile } = require( '@gov.au/pancake' );


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Helpers
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
const fileExists = filePath => {
	try {
		return typeof filePath === 'string' && Fs.existsSync( filePath );
	}
	catch {
		return false;
	}
};

const uniquePairs = pairs => {
	const seen = new Set();

	return pairs.filter( pair => {
		const key = `${ pair.source } -> ${ pair.dest }`;
		if( seen.has( key ) ) {
			return false;
		}

		seen.add( key );
		return true;
	});
};


/**
 * Get react file from module and write to disk
 *
 * @param  {string} from     - Where is the module so we can read from there
 * @param  {string} to       - Where shall we write the module to
 * @param  {string} tag      - The tag to be added to the top of the file
 *
 * @return {Promise<string>} - The react wrapper content that was copied
 */
module.exports.HandleReact = async ( from, to, tag ) => {
	let code;

	try {
		code = await ReadFile( from );
	}
	catch( error ) {
		Log.error(`Unable to read file ${ Style.yellow( from ) }`);
		Log.error( error );

		throw error;
	}

	await WriteFile( to, code );

	const fromInfo = Path.parse( from );
	const toInfo = Path.parse( to );
	const sourceBase = Path.join( fromInfo.dir, fromInfo.name );
	const destBase = Path.join( toInfo.dir, toInfo.name );
	const variantExts = new Set([ '.js', '.mjs' ]);
	const copyTargets = [];

	variantExts.delete( fromInfo.ext );

	for( const ext of variantExts ) {
		const variantSource = `${ sourceBase }${ ext }`;
		const variantDest = `${ destBase }${ ext }`;

		if( variantSource !== from && fileExists( variantSource ) ) {
			copyTargets.push({
				source: variantSource,
				dest: variantDest,
			});
		}
	}

	const typeExts = [ '.d.ts', '.d.mts', '.d.cts' ];

	for( const ext of typeExts ) {
		const typeSource = `${ sourceBase }${ ext }`;
		const typeDest = `${ destBase }${ ext }`;

		if( fileExists( typeSource ) ) {
			copyTargets.push({
				source: typeSource,
				dest: typeDest,
			});
		}
	}

	for( const { source, dest } of uniquePairs( copyTargets ) ) {
		try {
			const content = await ReadFile( source );
			await WriteFile( dest, content );
		}
		catch( error ) {
			Log.error(`Unable to copy React companion file ${ Style.yellow( source ) }`);
			Log.error( error );
			throw error;
		}
	}

	return code;
};
