#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';

const args = new Set(process.argv.slice(2));
const allowDirty = args.has('--allow-dirty');
const skipPublish = args.has('--skip-publish');
const root = resolve(process.cwd());

const log = {
	info: message => console.log(`\u25b6\ufe0f  ${ message }`),
	step: message => console.log(`\n=== ${ message } ===`),
	success: message => console.log(`\u2705  ${ message }`),
	warn: message => console.warn(`\u26a0\ufe0f  ${ message }`),
	error: message => console.error(`\u274c  ${ message }`),
};

const run = (command, cmdArgs, options = {}) => {
	const result = spawnSync(command, cmdArgs, {
		cwd: root,
		encoding: 'utf8',
		stdio: options.stdio ?? 'pipe',
		env: { ...process.env, ...options.env },
	});

	if (result.error) {
		throw result.error;
	}

	return result;
};

const parseStatusLine = line => {
	const code = line.slice(0, 2);
	const path = line.slice(3).trim();
	return { code: code.trim() || code, path };
};

const getGitStatus = () => {
	const statusResult = run('git', ['status', '--porcelain']);

	if (statusResult.status !== 0) {
		process.stderr.write(statusResult.stderr || '');
		throw new Error('Failed to read git status');
	}

	const lines = (statusResult.stdout || '').split('\n').filter(Boolean);
	return lines.map(parseStatusLine);
};

const cleanupChanges = (initialPaths) => {
	const currentStatus = getGitStatus();
	const newEntries = currentStatus.filter(entry => !initialPaths.has(entry.path));

	if (newEntries.length === 0) {
		return;
	}

	const tracked = [];
	const untracked = [];

	for (const entry of newEntries) {
		if (entry.code === '??') {
			untracked.push(entry.path);
		}
		else {
			tracked.push(entry.path);
		}
	}

	if (tracked.length > 0) {
		const restoreResult = run('git', ['restore', '--source=HEAD', '--staged', '--worktree', '--', ...tracked]);
		if (restoreResult.status !== 0) {
			process.stderr.write(restoreResult.stderr || '');
			throw new Error('Failed to restore tracked files after dry-run');
		}
	}

	for (const path of untracked) {
		const cleanResult = run('git', ['clean', '-f', '--', path]);
		if (cleanResult.status !== 0) {
			process.stderr.write(cleanResult.stderr || '');
			throw new Error(`Failed to remove untracked file ${ path } created during dry-run`);
		}
	}
};

const extractWarnings = (output = '') => {
	const lines = output.split('\n');
	return lines.filter(line => /\bWARN\b|warning/i.test(line));
};

const getWorkspacePackages = () => {
	const packagesDir = resolve(root, 'packages');
	const entries = readdirSync(packagesDir, { withFileTypes: true });

	return entries
		.filter(entry => entry.isDirectory())
		.map(entry => {
			const pkgPath = join(packagesDir, entry.name, 'package.json');
			const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

			return {
				name: pkg.name,
				dir: join(packagesDir, entry.name),
				private: pkg.private === true,
			};
		})
		.filter(pkg => !pkg.private);
};

const main = () => {
	const initialStatus = getGitStatus();
	const initialPaths = new Set(initialStatus.map(entry => entry.path));

	if (initialPaths.size > 0 && !allowDirty) {
		log.error('Working tree is dirty. Commit, stash, or pass --allow-dirty before running the release dry-run.');
		process.exitCode = 1;
		return;
	}

	let touchedVersionFiles = false;

	try {
		log.step('Changeset status');
		const statusResult = run('pnpm', ['exec', 'changeset', 'status']);
		process.stdout.write(statusResult.stdout || '');
		process.stderr.write(statusResult.stderr || '');

		if (statusResult.status !== 0) {
			throw new Error('`pnpm exec changeset status` failed');
		}

		log.step('Applying version updates with Changesets');
		const versionResult = run('pnpm', ['exec', 'changeset', 'version']);
		process.stdout.write(versionResult.stdout || '');
		process.stderr.write(versionResult.stderr || '');

		const versionOutput = `${ versionResult.stdout || '' }\n${ versionResult.stderr || '' }`;
		const noChangesets = /No unreleased changesets/i.test(versionOutput);

		if (versionResult.status !== 0 && !noChangesets) {
			throw new Error('`pnpm exec changeset version` failed');
		}

		if (noChangesets) {
			log.warn('No pending changesets detected. Skipping publish dry-run.');
			return;
		}

		touchedVersionFiles = true;

		if (skipPublish) {
			log.warn('Skipping publish dry-run because --skip-publish was provided.');
			return;
		}

		log.step('Running pnpm publish --dry-run for each workspace');
		const packages = getWorkspacePackages();
		const summary = [];
		let failures = 0;

		for (const pkg of packages) {
			log.info(`Publishing ${ pkg.name } (dry-run)`);
			const publishArgs = ['publish', '--filter', pkg.name, '--dry-run', '--no-git-checks', '--access', 'public'];
			const publishResult = run('pnpm', publishArgs);
			process.stdout.write(publishResult.stdout || '');
			process.stderr.write(publishResult.stderr || '');

			const combinedOutput = `${ publishResult.stdout || '' }\n${ publishResult.stderr || '' }`;
			const warnings = extractWarnings(combinedOutput);
			const ok = publishResult.status === 0;

			if (!ok) {
				failures += 1;
			}

			summary.push({ name: pkg.name, ok, warnings });
		}

		log.step('Dry-run summary');
		for (const item of summary) {
			const statusLabel = item.ok ? 'ok' : 'failed';
			console.log(`- ${ item.name }: ${ statusLabel }`);
			for (const warning of item.warnings) {
				log.warn(`  ${ warning }`);
			}
		}

		if (summary.every(item => item.warnings.length === 0)) {
			log.success('No publish warnings reported.');
		}

		if (failures > 0) {
			throw new Error(`Dry-run publishing failed for ${ failures } package(s).`);
		}
	}
	finally {
		if (touchedVersionFiles) {
			try {
				cleanupChanges(initialPaths);
			}
			catch (cleanupError) {
				log.warn(`Cleanup encountered an issue: ${ cleanupError.message }`);
				throw cleanupError;
			}
		}
	}
};

try {
	main();
}
catch (error) {
	log.error(error.message || error);
	process.exitCode = 1;
}
