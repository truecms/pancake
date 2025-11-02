#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { mkdir, readdir, access, rm } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
const rootDir = path.resolve( __dirname, '..' );
const packagesDir = path.join( rootDir, 'packages' );
const packOutputDir = path.join( rootDir, '.tmp', 'install-check' );

const run = ( command, args, options = {} ) => new Promise( ( resolve, reject ) => {
	const child = spawn( command, args, {
		stdio: 'inherit',
		cwd: rootDir,
		env: process.env,
		...options,
	} );

	child.on( 'error', reject );

	child.on( 'close', code => {
		if( code === 0 ) {
			resolve();
		}
		else {
			const error = new Error(`${ command } ${ args.join( ' ' ) } exited with code ${ code }`);
			error.exitCode = code;
			reject( error );
		}
	});
} );

const discoverPackages = async () => {
	const entries = await readdir( packagesDir, { withFileTypes: true } );
	const packages = [];

	for( const entry of entries ) {
		if( !entry.isDirectory() ) {
			continue;
		}

		const packagePath = path.join( packagesDir, entry.name );
		try {
			await access( path.join( packagePath, 'package.json' ), fsConstants.F_OK );
			packages.push({ name: entry.name, path: packagePath });
		}
		catch( error ) {
			// ignore directories without package.json files
		}
	}

	return packages;
};

const ensureCleanPackDirectory = async () => {
	await rm( packOutputDir, { recursive: true, force: true } );
	await mkdir( packOutputDir, { recursive: true } );
};

const runInstallCheck = async () => {
	console.log( '▶ Running pnpm install --frozen-lockfile' );
	await run( 'pnpm', [ 'install', '--frozen-lockfile' ] );

	console.log( '▶ Running pnpm run build' );
	await run( 'pnpm', [ 'run', 'build' ] );

	await ensureCleanPackDirectory();
	const workspaces = await discoverPackages();

	for( const workspace of workspaces ) {
		console.log( `▶ Packing ${ workspace.name }` );
		await run( 'pnpm', [ 'pack', '--pack-destination', packOutputDir ], { cwd: workspace.path } );
	}

	console.log( `✅ Install check completed. Tarballs available in ${ packOutputDir }` );
};

runInstallCheck()
	.then( () => {
		process.exit( 0 );
	})
	.catch( error => {
		console.error( error.message || error );
		process.exit( error.exitCode || 1 );
	} );
