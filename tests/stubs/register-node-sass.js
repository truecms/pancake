const Module = require( 'module' );
const Path = require( 'path' );

const stub = require( Path.join( __dirname, 'node-sass.cjs' ) );
const originalRequire = Module.prototype.require;

Module.prototype.require = function patchedRequire( id ) {
	if( id === 'node-sass' ) {
		return stub;
	}

	return originalRequire.apply( this, arguments );
};
