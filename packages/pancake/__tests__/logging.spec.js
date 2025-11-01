/***************************************************************************************************************************************************************
 *
 * log.js unit tests
 *
 * @file - pancake/src/log.js
 *
 **************************************************************************************************************************************************************/


const { Style, Log } = require( '../src/log' );

const originalLog = console.log;
const originalInfo = console.info;
const originalError = console.error;

const stubConsole = () => {
	console.log = jest.fn();
	console.info = jest.fn();
	console.error = jest.fn();
};

const restoreConsole = () => {
	console.log = originalLog;
	console.info = originalInfo;
	console.error = originalError;
};

beforeEach(() => {
	stubConsole();
	Log.reset();
	Log.configure({ mode: 'pretty', verbose: false });
});

afterEach(() => {
	restoreConsole();
});


describe('Style helpers', () => {
	test('parse returns empty string for undefined input', () => {
		expect( Style.parse( undefined ) ).toBe('');
	});

	test('parse wraps message with ansi start/end codes', () => {
		expect( Style.parse( 'TEST', '666m', '777m' ) ).toBe('\u001B[666mTEST\u001b[777m');
	});

	test('parse allows nested ansi codes', () => {
		expect(
			Style.parse(
				`TEST ${ Style.parse( 'SUBTEST', '666m', '777m' ) } STRING`,
				'666m',
				'777m'
			)
		).toBe('\u001B[666mTEST \u001B[666mSUBTEST\u001B[666m STRING\u001b[777m');
	});
});


describe('Pretty mode logging', () => {
	test('space writes a blank line once', () => {
		Log.space();
		expect( console.log ).toHaveBeenCalledWith('\n');
	});

	test('info prefixes message and pauses spinner', () => {
		Log.info('test info');

		expect( console.log ).toHaveBeenCalledWith('\n');
		expect( console.info ).toHaveBeenCalledWith('🔔  INFO:    test info');
	});

	test('ok outputs green message', () => {
		Log.ok('all good');

		expect( console.info ).toHaveBeenCalledWith('👍  \u001B[32mOK:\u001b[39m      \u001B[32mall good\u001b[39m');
	});

	test('done prints rocket banner', () => {
		Log.done('launch');

		expect( console.info ).toHaveBeenCalledWith('🚀           \u001B[32m\u001B[1mlaunch\u001b[22m\u001b[39m');
	});

	test('verbose logs only when enabled', () => {
		Log.verbose('hidden');
		expect( console.info ).not.toHaveBeenCalled();

		Log.configure({ verbose: true });
		Log.output = false;
		Log.verbose('now visible');

		expect( console.info ).toHaveBeenCalledWith('😬  \u001B[90mVERBOSE: now visible\u001b[39m');
	});

	test('error prints banner once and sets exit code', () => {
		jest.spyOn( Math, 'random' ).mockReturnValue( 0 );

		Log.error('boom');
		expect( console.log.mock.calls.length ).toBeGreaterThanOrEqual( 3 );
		expect( console.error ).toHaveBeenCalledWith('🔥  \u001B[31mERROR:   boom\u001b[39m');
		expect( Log.getExitCode() ).toBe( 1 );
		expect( process.exitCode ).toBe( 1 );

		console.log.mockClear();
		console.error.mockClear();
		Log.error('boom again');
		expect( console.error ).toHaveBeenCalledWith('🔥  \u001B[31mERROR:   boom again\u001b[39m');

		Math.random.mockRestore();
	});
});


describe('JSON mode logging', () => {
	test('emits structured log objects', () => {
		const jsonLogs = [];
		Log.configure({
			mode: 'json',
			verbose: true,
			streams: {
				log: value => jsonLogs.push( value ),
				info: () => {},
				error: value => jsonLogs.push( value ),
			},
		});
		Log.output = false;

		Log.info('structured', { id: 42 });

		expect( jsonLogs ).toHaveLength( 1 );
		const payload = JSON.parse( jsonLogs[ 0 ] );
		expect( payload.level ).toBe('info');
		expect( payload.message ).toBe('structured');
		expect( payload.meta ).toMatchObject({ id: 42 });
		expect( payload.timestamp ).toBeDefined();

		jsonLogs.length = 0;
		Log.verbose('extra', { foo: 'bar' });
		expect( jsonLogs ).toHaveLength( 1 );
		const verbosePayload = JSON.parse( jsonLogs[ 0 ] );
		expect( verbosePayload.level ).toBe('verbose');
		expect( verbosePayload.meta ).toMatchObject({ foo: 'bar' });
	});
});


describe('Silent mode logging', () => {
	test('suppresses non-error output but still surfaces errors', () => {
		Log.configure({ mode: 'silent' });
		Log.info('quiet');
		expect( console.info ).not.toHaveBeenCalled();
		expect( console.log ).not.toHaveBeenCalled();

		Log.error('still visible');
		expect( console.error ).toHaveBeenCalledWith('🔥  \u001B[31mERROR:   still visible\u001b[39m');
	});
});
