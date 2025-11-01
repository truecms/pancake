/***************************************************************************************************************************************************************
 *
 * parse-arguments.js unit tests
 *
 * @file - pancake/src/parse-arguments.js
 *
 **************************************************************************************************************************************************************/


const { ParseArgs } = require( '../src/parse-arguments' );


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Shared fixtures
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
const settings = {
	'npmOrg': '@gov.au @nsw.gov.au',
	'plugins': true,
	'ignorePlugins': [],
};

const baseExpectation = {
	cwd: undefined,
	version: false,
	verbose: false,
	nosave: false,
	set: [],
	org: settings.npmOrg,
	json: false,
	silent: false,
	plugins: true,
	ignorePlugins: [],
	help: false,
};


describe('ParseArgs', () => {
	test('single flag toggles help', () => {
		const args = ['node', 'pancake', '--help'];
		expect( ParseArgs( settings, args ) ).toEqual({
			...baseExpectation,
			help: true,
		});
	});

	test('multiple flags toggle plugins off', () => {
		const args = ['node', 'pancake', '--help', '--noplugins'];
		expect( ParseArgs( settings, args ) ).toEqual({
			...baseExpectation,
			help: true,
			plugins: false,
		});
	});

	test('all long-form flags including json logging', () => {
		const args = [
			'node',
			'pancake',
			'path/file',
			'--set', 'npmOrg', '@yourOrg',
			'--verbose',
			'--version',
			'--nosave',
			'--noplugins',
			'--ignore', '@gov.au/pancake-js,@gov.au/pancake-sass',
			'--json',
			'--help',
		];

		expect( ParseArgs( settings, args ) ).toEqual({
			...baseExpectation,
			cwd: 'path/file',
			set: ['npmOrg', '@yourOrg'],
			verbose: true,
			version: true,
			nosave: true,
			plugins: false,
			ignorePlugins: ['@gov.au/pancake-js', '@gov.au/pancake-sass'],
			help: true,
			json: true,
		});
	});

	test('short-form flags include silent and json', () => {
		const args = [
			'node',
			'pancake',
			'path/file',
			'-s', 'npmOrg', '@yourOrg',
			'-v',
			'-V',
			'-n',
			'-p',
			'-i', '@gov.au/pancake-js,@gov.au/pancake-sass',
			'-j',
			'-q',
			'-h',
		];

		expect( ParseArgs( settings, args ) ).toEqual({
			...baseExpectation,
			cwd: 'path/file',
			set: ['npmOrg', '@yourOrg'],
			verbose: true,
			version: true,
			nosave: true,
			plugins: false,
			ignorePlugins: ['@gov.au/pancake-js', '@gov.au/pancake-sass'],
			help: true,
			json: true,
			silent: true,
		});
	});
});
