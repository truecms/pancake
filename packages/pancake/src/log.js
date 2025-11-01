/***************************************************************************************************************************************************************
 *
 * Logging utilities with structured output modes
 *
 * @repo    - https://github.com/govau/pancake
 * @author  - Dominik Wilkowski
 * @license - https://raw.githubusercontent.com/govau/pancake/master/LICENSE (MIT)
 *
 **************************************************************************************************************************************************************/

'use strict';


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// ANSI escape colour helpers (kept for compatibility with historical output)
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
const Style = {
	parse: ( text, start, end = `39m` ) => {
		if( text === undefined || text === null ) {
			return ``;
		}

		const replace = new RegExp( `\\u001b\\[${ end }`, 'g' );

		return `\u001B[${ start }${ text.toString().replace( replace, `\u001B[${ start }` ) }\u001b[${ end }`;
	},
	black: text => Style.parse( text, `30m` ),
	red: text => Style.parse( text, `31m` ),
	green: text => Style.parse( text, `32m` ),
	yellow: text => Style.parse( text, `33m` ),
	blue: text => Style.parse( text, `34m` ),
	magenta: text => Style.parse( text, `35m` ),
	cyan: text => Style.parse( text, `36m` ),
	white: text => Style.parse( text, `37m` ),
	gray: text => Style.parse( text, `90m` ),
	bold: text => Style.parse( text, `1m`, `22m` ),
};


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Internal state helpers
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
const state = {
	mode: 'pretty',
	verbose: false,
	output: false,
	hasError: false,
	exitCode: 0,
};

const consoleStream = ( key ) => ( ...args ) => console[ key ]( ...args );

const defaultStreams = {
	log: consoleStream( 'log' ),
	info: consoleStream( 'info' ),
	error: consoleStream( 'error' ),
};

const streams = { ...defaultStreams };

const updateExitCode = ( code ) => {
	if( Number.isInteger( code ) && code > state.exitCode ) {
		state.exitCode = code;
		process.exitCode = state.exitCode;
	}
};

const cloneMeta = ( meta = {} ) => {
	return Object.keys( meta ).length ? Object.assign( {}, meta ) : {};
};

const normalisePayload = ( payload, meta = {} ) => {
	const details = cloneMeta( meta );

	if( payload instanceof Error ) {
		details.stack = payload.stack;
		return { message: payload.message, details };
	}

	if( Array.isArray( payload ) ) {
		return { message: payload.join(' '), details };
	}

	if( payload && typeof payload === 'object' ) {
		const { message, ...rest } = payload;

		if( message ) {
			Object.assign( details, rest );
			return { message: String( message ), details };
		}

		Object.assign( details, payload );
		return { message: JSON.stringify( payload ), details };
	}

	if( payload === undefined || payload === null ) {
		return { message: '', details };
	}

	return { message: String( payload ), details };
};

const prettyWriters = {
	info: message => `🔔  INFO:    ${ message }`,
	ok: message => `👍  ${ Style.green('OK:') }      ${ Style.green( message ) }`,
	done: message => `🚀           ${ Style.green( Style.bold( message ) ) }`,
	error: message => `🔥  ${ Style.red(`ERROR:   ${ message }`) }`,
	verbose: message => `😬  ${ Style.gray(`VERBOSE: ${ message }`) }`,
};

const chooseStream = level => ( level === 'error' ? streams.error : streams.info );

const printErrorBanner = ( message ) => {
	const messages = [
		`Uh oh`, `Oh no`, `Sorry`, `D'oh`, `Oh my`, `Ouch`, `Oops`, `Nein`, `Mhh`,
		`Gosh`, `Gee`, `Goodness`, `Fiddlesticks`, `Dang`, `Dear me`, `Oh dear`,
		`Phew`, `Pardon`, `Whoops`, `Darn`, `Jinx`, `No luck`, `Cursed`, `Poppycock`,
		`Humbug`, `Hogwash`, `Boloney`, `Codswallop`, `Nuts`, `Foolery`, `Lunacy`,
		`Shenanigans`, `Fudge`, `Blimey`, `Dagnabit`, `Bugger`, `Pillock`, `Fudge`,
		`Crickey`,
	];

	const prefix = messages.sort( () => 0.5 - Math.random() )[0] || `Uh oh`;

	streams.log( Style.red(`                         ${ `/`.repeat( prefix.length + 6 ) }`) );
	streams.log( Style.red(`                        +${ `-`.repeat( prefix.length + 4 ) }+/`) );
	streams.log( Style.red(`            (っ˘̩╭╮˘̩)っ  |  `) + Style.bold( Style.red( prefix ) ) + Style.red(`  |/`) );
	streams.log( Style.red(`                        +${ `-`.repeat( prefix.length + 4 ) }+`) + `\n` );

	if( message ) {
		streams.error( prettyWriters.error( message ) );
	}
};

const isSilent = level => state.mode === 'silent' && level !== 'error';

const emit = ( level, payload, meta ) => {
	if( level === 'verbose' && !state.verbose ) {
		return;
	}

	if( isSilent( level ) ) {
		return;
	}

	const { message, details } = normalisePayload( payload, meta );
	const timestamp = new Date().toISOString();

	if( state.mode === 'json' ) {
		const event = { timestamp, level, message };

		if( Object.keys( details ).length ) {
			event.meta = details;
		}

		const json = JSON.stringify( event );
		const stream = level === 'error' ? streams.error : streams.log;

		stream( json );
		state.output = true;
		return;
	}

	if( !state.output ) {
		Log.space();
	}

	const stream = chooseStream( level );
	const writer = prettyWriters[ level ] || ( msg => msg );

	stream( writer( message ) );
	state.output = true;
};


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Loading animation (disabled outside of pretty mode)
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
const Loading = (() => {
	const sequence = [
		Style.gray(`            ( ^-^)${ Style.yellow(`旦`) }                 `),
		Style.gray(`             ( ^-^)${ Style.yellow(`旦`) }                `),
		Style.gray(`              ( ^-^)${ Style.yellow(`旦`) }               `),
		Style.gray(`               ( ^-^)${ Style.yellow(`旦`) }              `),
		Style.gray(`                ( ^-^)${ Style.yellow(`旦`) }             `),
		Style.gray(`                 ( ^-^)${ Style.yellow(`旦`) }            `),
		Style.gray(`                  ( ^-^)${ Style.yellow(`旦`) }           `),
		Style.gray(`                   ( ^-^)${ Style.yellow(`旦`) }          `),
		Style.gray(`                    ( ^-^)${ Style.yellow(`旦`) }         `),
		Style.gray(`                     ( ^-^)${ Style.yellow(`旦`) }        `),
		Style.gray(`                      ( ^-^)${ Style.yellow(`旦`) }       `),
		Style.gray(`                       ( ^-^)${ Style.yellow(`旦`) }      `),
		Style.gray(`                        ( ^-^)${ Style.yellow(`旦`) }     `),
		Style.gray(`                         ( ^-^)${ Style.yellow(`旦`) }    `),
		Style.gray(`                          ( ^-^)${ Style.yellow(`旦`) }   `),
		Style.gray(`                           ( ^-^)${ Style.yellow(`旦`) }  `),
		Style.gray(`                            ( ^-^)${ Style.yellow(`旦`) } `),
		Style.gray(`                            ( ^-^)${ Style.yellow(`旦`) } `),
		Style.gray(`                             ( ^-^)${ Style.yellow(`旦`) }`),
		Style.gray(`                            ${ Style.yellow(`旦`) }(^-^ ) `),
		Style.gray(`                           ${ Style.yellow(`旦`) }(^-^ )  `),
		Style.gray(`                          ${ Style.yellow(`旦`) }(^-^ )   `),
		Style.gray(`                         ${ Style.yellow(`旦`) }(^-^ )    `),
		Style.gray(`                        ${ Style.yellow(`旦`) }(^-^ )     `),
		Style.gray(`                       ${ Style.yellow(`旦`) }(^-^ )      `),
		Style.gray(`                      ${ Style.yellow(`旦`) }(^-^ )       `),
		Style.gray(`                     ${ Style.yellow(`旦`) }(^-^ )        `),
		Style.gray(`                    ${ Style.yellow(`旦`) }(^-^ )         `),
		Style.gray(`                   ${ Style.yellow(`旦`) }(^-^ )          `),
		Style.gray(`                  ${ Style.yellow(`旦`) }(^-^ )           `),
		Style.gray(`                 ${ Style.yellow(`旦`) }(^-^ )            `),
		Style.gray(`                ${ Style.yellow(`旦`) }(^-^ )             `),
		Style.gray(`               ${ Style.yellow(`旦`) }(^-^ )              `),
		Style.gray(`              ${ Style.yellow(`旦`) }(^-^ )               `),
		Style.gray(`             ${ Style.yellow(`旦`) }(^-^ )                `),
		Style.gray(`            ${ Style.yellow(`旦`) }(^-^ )                 `),
	];

	let index = 0;
	let timer = null;
	const running = {};
	const speed = 80;

	const clearSpinner = () => {
		if( timer ) {
			clearInterval( timer );
			timer = null;
			process.stdout.write('\r\r\x1b[K');
		}
	};

	const canAnimate = () => state.mode === 'pretty' && !state.verbose;

	const startSpinner = () => {
		if( timer || !canAnimate() ) {
			return;
		}

		process.stdout.write( sequence[ index ] );

		timer = setInterval(() => {
			process.stdout.write('\r\x1b[K');
			index = ( index < sequence.length - 1 ) ? index + 1 : 0;
			process.stdout.write( sequence[ index ] );
		}, speed );
	};

	return {
		running,

		start: ( plugin = 'pancake' ) => {
			if( !canAnimate() ) {
				return;
			}

			running[ plugin ] = true;
			clearSpinner();
			startSpinner();
		},

		stop: ( plugin = 'pancake' ) => {
			delete running[ plugin ];

			if( Object.keys( running ).length === 0 ) {
				clearSpinner();
			}
		},

		pause: () => {
			clearSpinner();
		},

		resume: () => {
			if( Object.keys( running ).length === 0 ) {
				return;
			}

			startSpinner();
		},
	};
})();


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Public logging API
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
const Log = {
	configure: ({ mode, verbose, streams: streamOverrides } = {} ) => {
		if( mode && [ 'pretty', 'json', 'silent' ].includes( mode ) ) {
			if( mode !== state.mode ) {
				state.mode = mode;

				if( mode !== 'pretty' ) {
					Loading.pause();
				}
			}
		}

		if( typeof verbose === 'boolean' ) {
			state.verbose = verbose;
		}

		if( streamOverrides && typeof streamOverrides === 'object' ) {
			if( typeof streamOverrides.log === 'function' ) {
				streams.log = streamOverrides.log;
			}

			if( typeof streamOverrides.info === 'function' ) {
				streams.info = streamOverrides.info;
			}

			if( typeof streamOverrides.error === 'function' ) {
				streams.error = streamOverrides.error;
			}
		}
	},

	error: ( payload, meta ) => {
		Loading.stop();

		const isFirstPrettyError = state.mode === 'pretty' && !state.hasError;

		if( isFirstPrettyError ) {
			if( !state.output ) {
				Log.space();
			}

			const { message } = normalisePayload( payload, meta );
			printErrorBanner( message );
			state.output = true;
		}
		else {
			emit( 'error', payload, meta );
		}

		state.hasError = true;
		updateExitCode( 1 );
	},

	info: ( payload, meta ) => {
		Loading.pause();
		emit( 'info', payload, meta );
		Loading.resume();
	},

	ok: ( payload, meta ) => {
		Loading.pause();
		emit( 'ok', payload, meta );
		Loading.resume();
	},

	done: ( payload, meta ) => {
		Loading.stop();
		emit( 'done', payload, meta );
	},

	verbose: ( payload, meta ) => {
		emit( 'verbose', payload, meta );
	},

	space: () => {
		if( state.mode === 'pretty' ) {
			streams.log(`\n`);
		}
	},

	reset: () => {
		state.output = false;
		state.hasError = false;
		state.exitCode = 0;
		process.exitCode = 0;
		streams.log = defaultStreams.log;
		streams.info = defaultStreams.info;
		streams.error = defaultStreams.error;
	},

	getExitCode: () => state.exitCode,
};

Object.defineProperties( Log, {
	verboseMode: {
		get: () => state.verbose,
		set: value => { state.verbose = Boolean( value ); },
	},
	output: {
		get: () => state.output,
		set: value => { state.output = Boolean( value ); },
	},
	hasError: {
		get: () => state.hasError,
		set: value => { state.hasError = Boolean( value ); },
	},
	mode: {
		get: () => state.mode,
		set: value => Log.configure({ mode: value }),
	},
	exitCode: {
		get: () => state.exitCode,
		set: value => updateExitCode( value ),
	},
});


module.exports.Style = Style;
module.exports.Loading = Loading;
module.exports.Log = Log;
