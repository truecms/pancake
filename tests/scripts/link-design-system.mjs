#!/usr/bin/env node

import {existsSync, lstatSync, readlinkSync} from 'node:fs';
import {mkdir, rm, symlink} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const SOURCE_ENV = 'DESIGN_SYSTEM_FIXTURES';
const DEFAULT_SOURCE = process.env.HOME
	? path.resolve(process.env.HOME, 'websites/sites/govau/design-system-components')
	: null;

const parsed = parseArgs(process.argv.slice(2));
const candidateSource = parsed.source ?? process.env[SOURCE_ENV] ?? DEFAULT_SOURCE;

if (!candidateSource) {
	errorLog('Unable to determine design-system source; set DESIGN_SYSTEM_FIXTURES or pass --source');
	process.exit(1);
}

const sourcePath = path.resolve(candidateSource);

(async () => {
	try {
		await ensureExists(sourcePath, 'source repository');

		const fixtureRoot = await ensureFixturesRoot();
		const mountPath = path.join(fixtureRoot, 'design-system-components');

		if (existsSync(mountPath)) {
			const alreadyLinked = isLinkedTo(mountPath, sourcePath);
			if (alreadyLinked && !parsed.force) {
				log(`Already linked to ${sourcePath}`);
				process.exit(0);
			}

			await rm(mountPath, { recursive: true, force: true });
			log(`Removed existing entry at ${mountPath}`);
		}

		const linkType = process.platform === 'win32' ? 'junction' : 'dir';
		await symlink(sourcePath, mountPath, linkType);
		log(`Linked ${mountPath} -> ${sourcePath}`);
	} catch (error) {
		errorLog(error instanceof Error ? error.message : String(error));
		process.exit(1);
	}
})();

function parseArgs(argv) {
	const result = { force: false };
	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === '--source' || arg === '-s') {
			result.source = argv[i + 1];
			i += 1;
		} else if (arg === '--force' || arg === '-f') {
			result.force = true;
		} else if (arg === '--help' || arg === '-h') {
			printHelp();
			process.exit(0);
		} else {
			errorLog(`Unknown argument: ${arg}`);
			printHelp();
			process.exit(1);
		}
	}
	return result;
}

async function ensureExists(target, label) {
	if (!existsSync(target)) {
		throw new Error(`Missing ${label}: ${target}`);
	}
}

async function ensureFixturesRoot() {
	const currentDir = path.dirname(fileURLToPath(import.meta.url));
	const fixtureRoot = path.resolve(currentDir, '..', 'fixtures');
	await mkdir(fixtureRoot, { recursive: true });
	return fixtureRoot;
}

function isLinkedTo(targetPath, expectedSource) {
	try {
		const stats = lstatSync(targetPath);
		if (!stats.isSymbolicLink()) {
			return false;
		}
		const resolvedLink = readlinkSync(targetPath);
		const absoluteLink = path.resolve(path.dirname(targetPath), resolvedLink);
		return absoluteLink === expectedSource;
	} catch (error) {
		return false;
	}
}

function log(message) {
	process.stdout.write(`${message}\n`);
}

function errorLog(message) {
	process.stderr.write(`error: ${message}\n`);
}

function printHelp() {
	const lines = [
		'Usage: node tests/scripts/link-design-system.mjs [options]',
		'',
		'Options:',
		'  -s, --source <path>  Override design-system repository location',
		'  -f, --force          Replace existing link even if already valid',
		'  -h, --help           Show this help message',
		'',
		`Environment: ${SOURCE_ENV} can override the default source path.`,
		`Default source: ${DEFAULT_SOURCE ?? 'n/a (HOME not set)'}`,
	];
	log(lines.join('\n'));
}
