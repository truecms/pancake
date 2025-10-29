/***************************************************************************************************************************************************************
 *
 * pancake.js unit tests
 *
 * @file - pancake/src/pancake.js
 *
 **************************************************************************************************************************************************************/


const {
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
	RecommendInstallCommand } = require( '../src/pancake' );

const Fs = require( 'fs' );
const Os = require( 'os' );
const Path = require( 'path' );


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// testing exports
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
test('syrup - Should define all exported functions', () => {
	expect( ExitHandler ).toBeDefined();
	expect( CheckNPM ).toBeDefined();
	expect( Cwd ).toBeDefined();
	expect( Size ).toBeDefined();
	expect( Spawning ).toBeDefined();
	expect( Log ).toBeDefined();
	expect( Style ).toBeDefined();
	expect( Loading ).toBeDefined();
	expect( ParseArgs ).toBeDefined();
	expect( CheckModules ).toBeDefined();
	expect( GetModules ).toBeDefined();
	expect( Settings ).toBeDefined();
	expect( GetFolders ).toBeDefined();
	expect( CreateDir ).toBeDefined();
	expect( WriteFile ).toBeDefined();
	expect( ReadFile ).toBeDefined();
	expect( CopyFile ).toBeDefined();
	expect( Semver ).toBeDefined();
	expect( ResolveLockfile ).toBeDefined();
	expect( RecommendInstallCommand ).toBeDefined();
});


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// lockfile helpers
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
const makeTempDir = () => Fs.mkdtempSync( Path.join( Os.tmpdir(), 'pancake-lock-' ) );

const removeDir = dir => {
	if( dir && Fs.existsSync( dir ) ) {
		Fs.rmSync( dir, { recursive: true, force: true } );
	}
};

test('ResolveLockfile - detects pnpm lockfile metadata', () => {
	const dir = makeTempDir();
	const lockPath = Path.join( dir, 'pnpm-lock.yaml' );
	Fs.writeFileSync( lockPath, '' );

	const info = ResolveLockfile( dir );

	try {
		expect( info ).toBeDefined();
		expect( info.manager ).toBe( 'pnpm' );
		expect( info.filename ).toBe( 'pnpm-lock.yaml' );
		expect( info.path ).toBe( lockPath );
	}
	finally {
		removeDir( dir );
	}
});

test('ResolveLockfile - falls back to npm lockfile when pnpm absent', () => {
	const dir = makeTempDir();
	const lockPath = Path.join( dir, 'package-lock.json' );
	Fs.writeFileSync( lockPath, '{}' );

	const info = ResolveLockfile( dir );

	try {
		expect( info ).toBeDefined();
		expect( info.manager ).toBe( 'npm' );
		expect( info.filename ).toBe( 'package-lock.json' );
		expect( info.path ).toBe( lockPath );
	}
	finally {
		removeDir( dir );
	}
});

test('ResolveLockfile - prioritises pnpm when multiple lockfiles exist', () => {
	const dir = makeTempDir();
	const pnpmPath = Path.join( dir, 'pnpm-lock.yaml' );
	const npmPath = Path.join( dir, 'package-lock.json' );
	Fs.writeFileSync( pnpmPath, '' );
	Fs.writeFileSync( npmPath, '{}' );

	const info = ResolveLockfile( dir );

	try {
		expect( info ).toBeDefined();
		expect( info.manager ).toBe( 'pnpm' );
		expect( info.path ).toBe( pnpmPath );
	}
	finally {
		removeDir( dir );
	}
});

test('RecommendInstallCommand - suggests pnpm add when pnpm lockfile detected', () => {
	const command = RecommendInstallCommand(
		{ manager: 'pnpm', filename: 'pnpm-lock.yaml', path: '/tmp/pnpm-lock.yaml' },
		[ '@truecms/pancake-sass', '@truecms/pancake-js' ]
	);

	expect( command ).toBe( 'pnpm add @truecms/pancake-sass @truecms/pancake-js' );
});

test('RecommendInstallCommand - defaults to npm when no lockfile metadata', () => {
	const command = RecommendInstallCommand( null, [ '@truecms/pancake-sass' ] );

	expect( command ).toBe( 'npm install @truecms/pancake-sass --save' );
});
