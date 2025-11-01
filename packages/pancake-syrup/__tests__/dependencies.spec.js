/***************************************************************************************************************************************************************
 *
 * dependencies.js unit tests
 *
 * @file - pancake-syrup/src/dependencies.js
 *
 **************************************************************************************************************************************************************/
if( !process.env.FORCE_COLOR ) {
	process.env.FORCE_COLOR = '3';
}

const { AddDeps } = require( '../src/dependencies' );

const cleanAnsi = line => line
	.replace(/\u001b\[2m(?=\u001b\[2m)/g, '')
	.replace(/\u001b\[2m(?=\u001b\[22m)/g, '' );

const normaliseLines = lines => lines.map( item => ( {
	type: item.type,
	line: cleanAnsi( item.line ),
} ) );


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// testing AddDeps
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
const dependencies1 = {
	"@truecms/core": "^0.1.0",
	"@truecms/link-list": "^0.1.0",
};
const installed1 = new Map();
installed1.set( '@truecms/testmodule1', '11.0.1' );
installed1.set( '@truecms/testmodule2', '11.0.0' );
installed1.set( '@truecms/testmodule3', '11.0.0' );

const result1 = {
	breakage: false,
	lines: [
		{
			type: 'separator',
			line: '\u001b[2m├── core       ^0.1.0            \u001b[22m',
		},
		{
			type: 'separator',
			line: '\u001b[2m└── link-list  ^0.1.0            \u001b[22m',
		},
	],
	breaking: [],
};

test('AddDeps - Should return an object with dependencies', () => {
	const rendered = AddDeps( dependencies1, installed1, 10 );
	rendered.lines = normaliseLines( rendered.lines );
	expect( rendered ).toMatchObject( result1 );
});


const dependencies2 = {
	"@truecms/core": "^0.1.0",
	"@truecms/link-list": "^0.1.0",
};
const installed2 = new Map();
installed2.set( '@truecms/testmodule1', '11.0.1' );
installed2.set( '@truecms/testmodule2', '11.0.0' );
installed2.set( '@truecms/testmodule3', '11.0.0' );
installed2.set( '@truecms/testmodule4', '12.0.0' );
installed2.set( '@truecms/testmodule5', '13.0.0' );

const result2 = {
	breakage: false,
	lines: [
		{
			type: 'separator',
			line: '\u001b[2m├── core                 ^0.1.0            \u001b[22m'
		},
		{
			type: 'separator',
			line: '\u001b[2m└── link-list            ^0.1.0            \u001b[22m'
		},
	],
	breaking: [],
};

test('AddDeps - Should return an object with dependencies nicely centered', () => {
	const rendered = AddDeps( dependencies2, installed2, 20 );
	rendered.lines = normaliseLines( rendered.lines );
	expect( rendered ).toMatchObject( result2 );
});


const dependencies3 = {
	"@truecms/core": "^0.1.0",
	"@truecms/link-list": "^0.1.0",
	"@truecms/testmodule2": "^11.1.0",
	"@truecms/testmodule5": "^13.1.0",
};
const installed3 = new Map();
installed3.set( '@truecms/testmodule1', '11.0.1' );
installed3.set( '@truecms/testmodule2', '11.0.0' );
installed3.set( '@truecms/testmodule3', '11.0.0' );
installed3.set( '@truecms/testmodule4', '12.0.0' );
installed3.set( '@truecms/testmodule5', '13.0.0' );

const result3 = {
	breakage: true,
	lines: [
		{
			type: 'separator',
			line: '\u001b[2m├── core                 ^0.1.0            \u001b[22m'
		},
		{
			type: 'separator',
			line: '\u001b[2m├── link-list            ^0.1.0            \u001b[22m'
		},
		{
			type: 'separator',
			line: '\u001b[2m├── \u001b[35mtestmodule2\u001b[39m          \u001b[35m^11.1.0   !   11.0.0\u001b[39m   installed\u001b[22m'
		},
		{
			type: 'separator',
			line: '\u001b[2m└── \u001b[35mtestmodule5\u001b[39m          \u001b[35m^13.1.0   !   13.0.0\u001b[39m   installed\u001b[22m'
		},
	],
	breaking: [
		'@truecms/testmodule2@^11.1.0',
		'@truecms/testmodule5@^13.1.0'
	],
};

test('AddDeps - Should highlight breaking dependencies', () => {
	const rendered = AddDeps( dependencies3, installed3, 20 );
	rendered.lines = normaliseLines( rendered.lines );
	expect( rendered ).toMatchObject( result3 );
});
