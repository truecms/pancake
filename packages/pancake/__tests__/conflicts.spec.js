/***************************************************************************************************************************************************************
 *
 * conflicts.js unit tests
 *
 * @file - pancake/src/conflicts.js
 *
 **************************************************************************************************************************************************************/


const { CheckModules } = require( '../src/conflicts' );


//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// CheckModules function
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
/**
 * Test for no conflicts
 */
const allModulesNoConflicts = [
	{
		'name': '@truecms/testmodule1',
		'version': '11.0.1',
		'peerDependencies': {},
	},
	{
		'name': '@truecms/testmodule2',
		'version': '11.0.0',
		'peerDependencies': {
			'@truecms/testmodule1': '^11.0.1',
		},
	},
	{
		'name': '@truecms/testmodule3',
		'version': '11.0.0',
		'peerDependencies': {
			'@truecms/testmodule1': '^11.0.1',
		},
	},
];

const resultNoConflicts = {
	'conflicts': false,
	'message': expect.any( String ),
	'module': '',
	'dependencies': {},
};

test('No conflicts between pancake modules should return correct result', () => {
	expect( CheckModules( allModulesNoConflicts ) ).toMatchObject( resultNoConflicts );
});


/**
 * Test for single minor conflict
 */
const allModulesMinorConflict = [
	{
		'name': '@truecms/testmodule1',
		'version': '11.0.1',
		'peerDependencies': {},
	},
	{
		'name': '@truecms/testmodule2',
		'version': '11.0.0',
		'peerDependencies': {
			'@truecms/testmodule1': '^11.0.1',
		},
	},
	{
		'name': '@truecms/testmodule3',
		'version': '11.0.0',
		'peerDependencies': {
			'@truecms/testmodule1': '^11.5.3',
		},
	},
];

const resultMinorConflict = {
	'conflicts': true,
	'message': expect.any( String ),
	'module': '@truecms/testmodule1',
	'dependencies': {
		'^11.5.3': [
			'@truecms/testmodule3',
		],
		'^11.0.1': [
			'@truecms/testmodule2',
		],
	},
};

test('Single minor conflict between pancake modules should return correct result', () => {
	expect( CheckModules( allModulesMinorConflict ) ).toMatchObject( resultMinorConflict );
});


/**
 * Test for multiple minor conflicts
 */
const allModulesMinorConflicts = [
	{
		'name': '@truecms/testmodule1',
		'version': '11.0.1',
		'peerDependencies': {},
	},
	{
		'name': '@truecms/testmodule2',
		'version': '11.0.0',
		'peerDependencies': {
			'@truecms/testmodule1':'^11.6.2',
		},
	},
	{
		'name': '@truecms/testmodule3',
		'version': '11.0.0',
		'peerDependencies': {
			'@truecms/testmodule1': '^11.5.3',
		},
	},
];

const resultMinorConflicts = {
	'conflicts': true,
	'message': expect.any( String ),
	'module': '@truecms/testmodule1',
	'dependencies': {
		'^11.5.3': [
			'@truecms/testmodule3',
		],
		'^11.6.2': [
			'@truecms/testmodule2',
		],
	},
};

test('Multiple minor conflicts between pancake modules should return correct result', () => {
	expect( CheckModules( allModulesMinorConflicts ) ).toMatchObject( resultMinorConflicts );
});


/**
 * Test for single major conflict due to breaking change module update
 */
const allModulesMajorConflict = [
	{
		'name': '@truecms/testmodule1',
		'version': '11.0.1',
		'peerDependencies': {},
	},
	{
		'name': '@truecms/testmodule2',
		'version': '11.0.0',
		'peerDependencies': {
			'@truecms/testmodule1': '^11.0.1',
		},
	},
	{
		'name': '@truecms/testmodule3',
		'version': '11.0.0',
		'peerDependencies': {
			'@truecms/testmodule1': '^10.0.1',
		},
	},
];

const resultMajorConflict = {
	'conflicts': true,
	'message': expect.any( String ),
	'module': '@truecms/testmodule1',
	'dependencies': {
		'^10.0.1': [
			'@truecms/testmodule3',
		],
		'^11.0.1': [
			'@truecms/testmodule2',
		],
	},
};

test('Single major conflict between pancake modules should return correct result', () => {
	expect( CheckModules( allModulesMajorConflict ) ).toMatchObject( resultMajorConflict );
});


/**
 * Test for multiple major conflicts due to multiple breaking change module updates
 */
const allModulesMajorConflicts = [
	{
		'name': '@truecms/testmodule1',
		'version': '11.0.1',
		'peerDependencies': {},
	},
	{
		'name': '@truecms/testmodule2',
		'version': '11.0.0',
		'peerDependencies': {
			'@truecms/testmodule1': '^11.0.1',
		},
	},
	{
		'name': '@truecms/testmodule3',
		'version': '11.0.0',
		'peerDependencies': {
			'@truecms/testmodule1': '^10.0.1',
		},
	},
	{
		'name': '@truecms/testmodule4',
		'version': '11.0.0',
		'peerDependencies': {
			'@truecms/testmodule1': '^9.0.1',
		},
	},
];

const resultMajorConflicts = {
	'conflicts': true,
	'message': expect.any( String ),
	'module': '@truecms/testmodule1',
	'dependencies': {
		'^10.0.1': [
			'@truecms/testmodule3',
		],
		'^11.0.1': [
			'@truecms/testmodule2',
		],
		'^9.0.1': [
			'@truecms/testmodule4',
		],
	},
};

test('Multiple major conflicts between pancake modules should return correct result', () => {
	expect( CheckModules( allModulesMajorConflicts ) ).toMatchObject( resultMajorConflicts );
});
