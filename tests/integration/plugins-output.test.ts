/* (file content inlined) */
import { describe, test, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { mkdtemp, rm, cp, readdir, readFile, stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import { spawn } from 'node:child_process';
import replaceInFile from 'replace-in-file';

type ScenarioConfig = {
	name: string;
	sourceDir: string;
	baselineDir: string;
	outputDir: string;
	options?: string[];
};

const __filename = fileURLToPath( import.meta.url );
const __dirname = dirname( __filename );
const rootDir = join( __dirname, '..', '..' );
const cliPath = join( rootDir, 'packages', 'pancake', 'bin', 'pancake' );
const nodeSassRegister = join( rootDir, 'tests', 'stubs', 'register-node-sass.js' );

const pancakePkg = JSON.parse( readFileSync( join( rootDir, 'packages', 'pancake', 'package.json' ), 'utf8' ) );
const sassPkg = JSON.parse( readFileSync( join( rootDir, 'packages', 'pancake-sass', 'package.json' ), 'utf8' ) );
const jsPkg = JSON.parse( readFileSync( join( rootDir, 'packages', 'pancake-js', 'package.json' ), 'utf8' ) );
const reactPkg = JSON.parse( readFileSync( join( rootDir, 'packages', 'pancake-react', 'package.json' ), 'utf8' ) );
const jsonPkg = JSON.parse( readFileSync( join( rootDir, 'packages', 'pancake-json', 'package.json' ), 'utf8' ) );

const placeholderFrom = [
	/\[version\]/g,
	/\[sass-version\]/g,
	/\[js-version\]/g,
	/\[react-version\]/g,
	/\[json-version\]/g,
	/\[path\]/g,
];

const placeholderTo = [
	pancakePkg.version,
	sassPkg.version,
	jsPkg.version,
	reactPkg.version,
	jsonPkg.version,
	rootDir,
];

const scenarios: ScenarioConfig[] = [
	{
		name: 'react-bundle',
		sourceDir: join( rootDir, 'tests', 'test10' ),
		baselineDir: join( rootDir, 'tests', 'baseline', 'test10', 'pancake' ),
		outputDir: 'pancake',
		options: [],
	},
	{
		name: 'json-manifest',
		sourceDir: join( rootDir, 'tests', 'test11' ),
		baselineDir: join( rootDir, 'tests', 'baseline', 'test11', 'pancake' ),
		outputDir: 'pancake',
		options: [],
	},
];

const makeTempDir = ( prefix: string ) => mkdtemp( join( os.tmpdir(), prefix ) );

const prepareScenario = async ( sourceDir: string ) => {
	const tempDir = await makeTempDir( 'pancake-int-scenario-' );
	await cp( sourceDir, tempDir, { recursive: true } );
	await rm( join( tempDir, 'pancake' ), { recursive: true, force: true } );
	await rm( join( tempDir, 'testfolder' ), { recursive: true, force: true } );
	return tempDir;
};

const prepareBaseline = async ( baselineDir: string ) => {
	const tempDir = await makeTempDir( 'pancake-int-baseline-' );
	await cp( baselineDir, tempDir, { recursive: true } );
	await replaceInFile( {
		files: join( tempDir, '**', '*' ),
		from: placeholderFrom,
		to: placeholderTo,
		allowEmptyPaths: true,
		encoding: 'utf8',
	} );
	return tempDir;
};

const runPancake = ( targetDir: string, options: string[] = [] ) => new Promise<void>( ( resolve, reject ) => {
	const args = [ '-r', nodeSassRegister, cliPath, targetDir, ...options ];
	const child = spawn( 'node', args, { cwd: rootDir } );
	let stderr = '';
	child.stderr.on( 'data', chunk => {
		stderr += chunk.toString();
	} );
	child.on( 'close', code => {
		if( code === 0 ) {
			resolve();
		}
		else {
			reject( new Error(`Pancake CLI exited with code ${ code }: ${ stderr }`) );
		}
	} );
} );

const collectFiles = async ( directory: string, base = directory ): Promise<string[]> => {
	const entries = await readdir( directory, { withFileTypes: true } );
	const files: string[] = [];

	for( const entry of entries ) {
		const fullPath = join( directory, entry.name );
		if( entry.isDirectory() ) {
			files.push( ...await collectFiles( fullPath, base ) );
		}
		else if( entry.isFile() ) {
			files.push( relative( base, fullPath ) );
		}
	}

	return files;
};

const assertDirectoryExists = async ( directory: string ) => {
	try {
		const stats = await stat( directory );
		if( !stats.isDirectory() ) {
			throw new Error(`${ directory } is not a directory`);
		}
	}
	catch( error ) {
		throw new Error(`Expected directory missing: ${ directory } (${ ( error as Error ).message })`);
	}
};

describe( 'plugin output regression', () => {
	for( const scenario of scenarios ) {
		test( `matches baseline for ${ scenario.name }`, { timeout: 120_000 }, async () => {
			const tempScenario = await prepareScenario( scenario.sourceDir );
			const tempBaseline = await prepareBaseline( scenario.baselineDir );

			try {
				await runPancake( tempScenario, scenario.options );

				const actualDir = join( tempScenario, scenario.outputDir );
				await assertDirectoryExists( actualDir );

				const expectedFiles = ( await collectFiles( tempBaseline ) ).sort();
				const actualFiles = ( await collectFiles( actualDir ) ).sort();

				expect( actualFiles, `${ scenario.name } produced unexpected files` ).toStrictEqual( expectedFiles );

				for( const relativePath of expectedFiles ) {
					const [ expectedRaw, actualContentRaw ] = await Promise.all( [
						readFile( join( tempBaseline, relativePath ), 'utf8' ),
						readFile( join( actualDir, relativePath ), 'utf8' ),
					] );
					const compareOpts = shouldCollapseEscapedBackslashes( relativePath ) ? { unescapeBackslashes: true } : undefined;
					const expectedContent = prepareExpectedContent( expectedRaw, compareOpts );
					const actualContent = normaliseContent( actualContentRaw, tempScenario, scenario.sourceDir, compareOpts );

					expect( actualContent, `Mismatch in ${ scenario.name }: ${ relativePath }` ).toBe( expectedContent );
				}
			}
			finally {
				await rm( tempScenario, { recursive: true, force: true } );
				await rm( tempBaseline, { recursive: true, force: true } );
			}
		} );
	}
} );

const escapeForRegExp = ( value: string ) => value.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );

const normaliseQuotes = ( value: string ) => value.replace( /"/g, '\'' );
const normaliseLineEndings = ( value: string ) => value.replace( /\r\n/g, '\n' );

const prepareExpectedContent = ( value: string, opts?: ContentOptions ) => {
	return applyContentOptions(
		normaliseQuotes( normaliseLineEndings( value ).trim() ),
		opts
	);
};

const normaliseContent = ( content: string, scenarioPath: string, sourceDir: string, opts?: ContentOptions ) => {
	const replaced = replaceScenarioPaths( content, scenarioPath, sourceDir );
	return applyContentOptions(
		normaliseQuotes( normaliseLineEndings( replaced ).trim() ),
		opts
	);
};

type ContentOptions = {
	unescapeBackslashes?: boolean;
};

const shouldCollapseEscapedBackslashes = ( relativePath: string ) => relativePath.endsWith( '.json' );

const applyContentOptions = ( value: string, opts?: ContentOptions ) => {
	if( opts?.unescapeBackslashes ) {
		return collapseEscapedBackslashes( value );
	}

	return value;
};

const collapseEscapedBackslashes = ( value: string ) => value.replace( /\\(?![\\])/g, '\\' ).replace( /\\\\/g, '\\' );

const replaceScenarioPaths = ( value: string, scenarioPath: string, sourceDir: string ) => {
	let output = replaceAll( value, scenarioPath, sourceDir );
	const escapedScenario = scenarioPath.replace( /\\/g, '\\\\' );
	if( escapedScenario !== scenarioPath ) {
		const escapedSource = sourceDir.replace( /\\/g, '\\\\' );
		output = replaceAll( output, escapedScenario, escapedSource );
	}
	return output;
};

const replaceAll = ( value: string, needle: string, replacement: string ) => {
	if( needle.length === 0 ) {
		return value;
	}
	return value.replace( new RegExp( escapeForRegExp( needle ), 'g' ), replacement );
};
