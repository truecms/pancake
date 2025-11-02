import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const rootDir = dirname( fileURLToPath( import.meta.url ) );

const workspacePackages = [
	'pancake',
	'pancake-js',
	'pancake-json',
	'pancake-react',
	'pancake-sass',
	'pancake-svg',
	'pancake-syrup'
];

const aliasEntries = workspacePackages.flatMap( pkg => {
	const sourcePath = resolve( rootDir, 'packages', pkg, 'src' );
	return [
		[ `@truecms/${ pkg }`, sourcePath ],
		[ `@truecms/${ pkg }`, sourcePath ]
	];
} );

const alias = Object.fromEntries( aliasEntries );

alias['node-sass'] = resolve( rootDir, 'tests', 'stubs', 'node-sass.cjs' );

export default defineConfig( {
	test: {
		globals: true,
		environment: 'node',
		include: [
			'packages/**/*.{spec,test}.{js,ts}',
			'tests/**/*.{spec,test}.{js,ts}'
		],
		setupFiles: [ resolve( rootDir, 'tests', 'vitest.setup.js' ) ],
		coverage: {
			provider: 'v8',
			reporter: [ 'text', 'html' ]
		}
	},
	resolve: {
		alias
	}
} );
