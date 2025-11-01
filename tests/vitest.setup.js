import { vi } from 'vitest';
import { createRequire } from 'node:module';

if( !process.env.FORCE_COLOR ) {
	process.env.FORCE_COLOR = '3';
}

if( process.stdout && process.stdout.isTTY === false ) {
	process.stdout.isTTY = true;
}

if( process.stderr && process.stderr.isTTY === false ) {
	process.stderr.isTTY = true;
}

const require = createRequire( import.meta.url );

try {
	const stub = require( './stubs/node-sass.cjs' );
	require.cache[ require.resolve( 'node-sass' ) ] = { exports: stub };
}
catch( error ) {
	// ignore caching errors; node-sass optional in some environments
}

if( !globalThis.jest ) {
	globalThis.jest = vi;
}

const restoreConsole = () => {
	console.log = console._originalLog || console.log;
	console.error = console._originalError || console.error;
	console.info = console._originalInfo || console.info;
};

beforeEach( () => {
	if( !console._originalLog ) {
		console._originalLog = console.log;
	}
	if( !console._originalError ) {
		console._originalError = console.error;
	}
	if( !console._originalInfo ) {
		console._originalInfo = console.info;
	}
} );

afterEach( () => {
	vi.restoreAllMocks();
	restoreConsole();
} );
