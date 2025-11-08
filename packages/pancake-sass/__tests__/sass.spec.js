/* (file content inlined) */
/***************************************************************************************************************************************************************
 *
 * sass.js unit tests
 *
 * @file - pancake-sass/src/sass.js
 *
 **************************************************************************************************************************************************************/
const Path = require( 'path' );
const Fs = require( 'fs' );
const Os = require( 'os' );


const { GetPath, GetDependencies, GenerateSass, Sassify } = require( '../src/sass' );

// Silence Sass deprecation warnings during unit tests to keep logs clean
process.env.PANCAKE_SASS_SILENCE_DEPRECATIONS = '1';

//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// GetPath function
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
const modules = [
	{
		'name': '@truecms/testmodule1',
		'version': '15.0.0',
		'peerDependencies': {},
		'pancake': {
			'pancake-module': {
				'version': '1.0.0',
				'plugins': [
					'@truecms/pancake-sass',
					'@truecms/pancake-js',
					'@truecms/pancake-json',
				],
				'sass': {
					'path': 'lib/sass/_module.scss',
				},
				'js': {
					'path': 'lib/js/module.js',
				},
			},
		},
		'path': `${ __dirname }/../../../tests/test1/node_modules/@truecms/testmodule1`,
	},
	{
		'name': '@truecms/testmodule2',
		'version': '19.0.0',
		'peerDependencies': {
			'@truecms/testmodule1': '^15.0.0',
		},
		'pancake': {
			'pancake-module': {
				'version': '1.0.0',
				'plugins': [
					'@truecms/pancake-sass',
					'@truecms/pancake-js',
					'@truecms/pancake-json',
				],
				'sass': {
					'path': 'lib/sass/_module.scss',
				},
				'js': {
					'path': 'lib/js/module.js',
				},
			},
		},
		'path': `${ __dirname }/../../../tests/test1/node_modules/@truecms/testmodule2`,
	},
];

const moduleName = '@truecms/testmodule2';
const baseLocation = Path.normalize(`${ __dirname }/../../../tests/test1/node_modules/@truecms/`);
const npmOrg = '@truecms';
const resultPath = '@truecms/testmodule2/lib/sass/_module.scss';

test('GetPath should return path for sass partial', () => {
	expect( GetPath( moduleName, modules, baseLocation, npmOrg ) ).toBe( resultPath );
});


test('GetPath should return path for sass partial with multiple orgs', () => {
	expect( GetPath( moduleName, modules, baseLocation, '@truecms @nsw.gov.au' ) ).toBe( resultPath );
});


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// GetDependencies function
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
const ResultDependencies = {
	'@truecms/testmodule1': '^15.0.0',
};

test('GetDependencies should return object of all dependencies', () => {
	expect( GetDependencies( moduleName, modules ) ).toMatchObject( ResultDependencies );
});


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// GenerateSass function
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
const ResultGenerateSass = `@use "@truecms/testmodule1/lib/sass/_module.scss" as *;\n` +
	`@use "@truecms/testmodule2/lib/sass/_module.scss" as *;\n`;

const Location = Path.normalize(`${ __dirname }/../../../tests/test1/node_modules/@truecms/testmodule2`);

test('GenerateSass should return path to sass partial import', () => {
	expect( GenerateSass( Location, moduleName, modules, npmOrg ) ).toBe( ResultGenerateSass );
});


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Sassify function
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
const pancakeVersion = require( Path.normalize(`${ __dirname }/../../pancake/package.json`) ).version;
const pancakeSassVersion = require( Path.normalize(`${ __dirname }/../package.json`) ).version;
const cssLocation = Path.normalize(`${ __dirname }/../../../tests/test1/pancake/css/pancake.min.css`);

const settings = {
	'minified': true,
	'modules': false,
	'browsers': [
		'last 2 versions',
		'ie 8',
		'ie 9',
		'ie 10',
	],
	'browserslist': [
		'last 2 versions',
		'ie 8',
		'ie 9',
		'ie 10',
	],
	'location': 'pancake/css/',
	'name': 'pancake.min.css',
};

const sass = `/*! PANCAKE v${ pancakeVersion } PANCAKE-SASS v${ pancakeSassVersion } */\n\n` +
	`@use "@truecms/testmodule1/lib/sass/_module.scss" as *;\n` +
	`@use "@truecms/testmodule2/lib/sass/_module.scss" as *;\n`;

const testCwd = Path.normalize(`${ __dirname }/../../../tests/test1`);

test('Sassify should resolve promise', () => {
	return Sassify( cssLocation, settings, sass, testCwd ).then( data => {
		expect( data ).toBe( true );
	});
});

test('Sassify should write sourcemap when enabled', async () => {
	const tempDir = Fs.mkdtempSync( Path.join( Os.tmpdir(), 'pancake-sass-test-' ) );
	const tempCssLocation = Path.join( tempDir, 'pancake.min.css' );
	const sourcemapSettings = Object.assign( {}, settings, { sourcemap: true } );

	try {
		await Sassify( tempCssLocation, sourcemapSettings, sass, testCwd );
		expect( Fs.existsSync( `${ tempCssLocation }.map` ) ).toBe( true );
	}
	finally {
		Fs.rmSync( tempDir, { recursive: true, force: true } );
	}
});
