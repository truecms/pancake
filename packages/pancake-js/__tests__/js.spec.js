/***************************************************************************************************************************************************************
 *
 * js.js unit tests
 *
 * @file - pancake-js/src/js.js
 *
 **************************************************************************************************************************************************************/

const Fs = require( 'fs' );
const Os = require( 'os' );
const Path = require( 'path' );

const { MinifyJS, HandleJS, MinifyAllJS } = require( '../src/js.js' );
const { Log } = require( '@truecms/pancake' );


const fixtureModulePath = Path.normalize(`${ __dirname }/../../../tests/test2/node_modules/@truecms/testmodule1/lib/js/module.js`);
const fixtureTag = '@truecms/testmodule1 v15.0.0';
const pancakeVersion = require( Path.normalize(`${ __dirname }/../../pancake/package.json`) ).version;
const pancakeJsVersion = require( Path.normalize(`${ __dirname }/../package.json`) ).version;

const makeTempDir = () => Fs.mkdtempSync( Path.join( Os.tmpdir(), 'pancake-js-' ) );
const cleanupTempDir = directory => Fs.rmSync( directory, { recursive: true, force: true } );

afterEach( () => {
	vi.restoreAllMocks();
});


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// MinifyJS function
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
const sampleJs = `var x = 2; var y = z;`;
const sampleFile = Path.normalize(`${ __dirname }/../../../tests/test2/node_modules/@truecms/testmodule2/lib/js/module.js`);

test( 'MinifyJS should return minified JS', () => {
	const output = MinifyJS( sampleJs, sampleFile );
	const normalized = output.replace( /\s+/g, '' );
	expect( normalized ).toMatch( /^var[a-z]=2,[a-z]=z;$/ );
});


const invalidJs = `const x => ( y, z ) { return "This shouldn't work" }`;

test( 'MinifyJS should return original JS when transform fails', () => {
	const errorSpy = vi.spyOn( Log, 'error' ).mockImplementation( () => {} );
	const output = MinifyJS( invalidJs, sampleFile );
	expect( output ).toBe( invalidJs );
	expect( errorSpy ).toHaveBeenCalled();
});


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// HandleJS function
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
test( 'HandleJS should emit CJS and ESM module outputs with sourcemaps', async () => {
	const tempDir = makeTempDir();
	const outputPath = Path.join( tempDir, 'testmodule1.js' );

	try {
		const settings = {
			minified: true,
			modules: true,
			sourcemap: true,
			location: 'pancake/js/',
			name: 'pancake.min.js',
		};

		const result = await HandleJS( fixtureModulePath, settings, outputPath, fixtureTag );
		const esmPath = outputPath.replace( /\.js$/, '.mjs' );

		expect( result.cjs.code ).toContain( 'confirm(' );
		expect( result.esm.code ).toContain( 'confirm(' );
		expect( result.cjs.code.startsWith(`/*! ${ fixtureTag } */`) ).toBe( true );
		expect( result.esm.code.startsWith(`/*! ${ fixtureTag } */`) ).toBe( true );
		expect( Fs.existsSync( outputPath ) ).toBe( true );
		expect( Fs.existsSync( esmPath ) ).toBe( true );
		expect( Fs.existsSync(`${ outputPath }.map`) ).toBe( true );
		expect( Fs.existsSync(`${ esmPath }.map`) ).toBe( true );
		expect( result.cjs.code ).toContain( '//# sourceMappingURL=testmodule1.js.map' );
		expect( result.esm.code ).toContain( '//# sourceMappingURL=testmodule1.mjs.map' );
	}
	finally {
		cleanupTempDir( tempDir );
	}
});


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// MinifyAllJS function
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
test( 'MinifyAllJS should write aggregated bundles in both module formats', async () => {
	const tempDir = makeTempDir();
	const moduleTarget = Path.join( tempDir, 'modules', 'testmodule1.js' );

	try {
		const moduleSettings = {
			minified: true,
			modules: true,
			sourcemap: true,
			location: 'pancake/js/',
			name: 'pancake.min.js',
		};

		const moduleResult = await HandleJS( fixtureModulePath, moduleSettings, moduleTarget, fixtureTag );

		const bundleSettings = {
			minified: true,
			modules: true,
			sourcemap: true,
			location: 'bundles/js/',
			name: 'pancake.min.js',
		};

		const bundleResult = await MinifyAllJS( pancakeVersion, [ moduleResult ], bundleSettings, tempDir );
		expect( bundleResult ).toBe( true );

		const cjsBundlePath = Path.join( tempDir, 'bundles/js/pancake.min.js' );
		const esmBundlePath = Path.join( tempDir, 'bundles/js/pancake.min.mjs' );

		expect( Fs.existsSync( cjsBundlePath ) ).toBe( true );
		expect( Fs.existsSync( esmBundlePath ) ).toBe( true );
		expect( Fs.existsSync(`${ cjsBundlePath }.map`) ).toBe( true );
		expect( Fs.existsSync(`${ esmBundlePath }.map`) ).toBe( true );

		const cjsContent = Fs.readFileSync( cjsBundlePath, 'utf8' );
		const esmContent = Fs.readFileSync( esmBundlePath, 'utf8' );
		const header = `/* PANCAKE v${ pancakeVersion } PANCAKE-JS v${ pancakeJsVersion } */`;

		expect( cjsContent.startsWith( header ) ).toBe( true );
		expect( esmContent.startsWith( header ) ).toBe( true );
		expect( cjsContent ).toContain(`/*! ${ fixtureTag } */`);
		expect( esmContent ).toContain(`/*! ${ fixtureTag } */`);
		expect( cjsContent ).toContain( 'confirm(' );
		expect( esmContent ).toContain( 'confirm(' );
	}
	finally {
		cleanupTempDir( tempDir );
	}
});
