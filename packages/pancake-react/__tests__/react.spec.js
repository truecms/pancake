/***************************************************************************************************************************************************************
 *
 * react.js unit tests
 *
 * @file - pancake-js/src/react.js
 *
 **************************************************************************************************************************************************************/

const Os = require( 'os' );
const Path = require( 'path' );
const Fs = require( 'fs/promises' );

const { HandleReact } = require( '../src/react.js' );


const makeTempDir = async () => {
	const prefix = Path.join( Os.tmpdir(), 'pancake-react-' );
	return Fs.mkdtemp( prefix );
};


test('HandleReact copies main, .mjs, and .d.ts files when present', async () => {
	const tempRoot = await makeTempDir();
	const sourceDir = Path.join( tempRoot, 'source' );
	const destDir = Path.join( tempRoot, 'dest' );

	await Fs.mkdir( sourceDir, { recursive: true } );

	const mainSource = Path.join( sourceDir, 'react.js' );
	const esmSource = Path.join( sourceDir, 'react.mjs' );
	const typesSource = Path.join( sourceDir, 'react.d.ts' );
	const mainContent = 'export default function Component() { return null; }\n';
	const esmContent = 'export const Component = () => null;\n';
	const typesContent = 'export declare const Component: () => null;\n';

	await Fs.writeFile( mainSource, mainContent, 'utf8' );
	await Fs.writeFile( esmSource, esmContent, 'utf8' );
	await Fs.writeFile( typesSource, typesContent, 'utf8' );

	const destMain = Path.join( destDir, 'testmodule.js' );

	try {
		const returned = await HandleReact( mainSource, destMain, '@scope/pkg v1.0.0' );

		const destEsm = Path.join( destDir, 'testmodule.mjs' );
		const destTypes = Path.join( destDir, 'testmodule.d.ts' );

		const [ copiedMain, copiedEsm, copiedTypes ] = await Promise.all([
			Fs.readFile( destMain, 'utf8' ),
			Fs.readFile( destEsm, 'utf8' ),
			Fs.readFile( destTypes, 'utf8' ),
		]);

		expect( returned ).toBe( mainContent );
		expect( copiedMain ).toBe( mainContent );
		expect( copiedEsm ).toBe( esmContent );
		expect( copiedTypes ).toBe( typesContent );
	}
	finally {
		await Fs.rm( tempRoot, { recursive: true, force: true } );
	}
});
