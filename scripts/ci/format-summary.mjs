#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);
let inputPath;
let title = 'Fixture Regression';

for( let index = 0; index < args.length; index += 1 ) {
  const arg = args[ index ];
  if( arg === '--input' ) {
    inputPath = args[ index + 1 ];
    index += 1;
  }
  else if( arg === '--title' ) {
    title = args[ index + 1 ] ?? title;
    index += 1;
  }
}

if( !inputPath ) {
  console.error('format-summary: missing --input argument');
  process.exit( 1 );
}

const stripAnsi = value => value
  .replace(/\u001b\][^\u001b]*\u001b\\/g, '')
  .replace(/\u001b\[[0-9;]*[A-Za-z]/g, '')
  .replace(/\u001b\[[0-9;]*F/g, '')
  .replace(/\r/g, '');

const parseLines = content => {
  const results = [];
  const extras = [];
  const statusRegex = /^(OK|FAIL)\s+(.+?)\s+(passed|failed)$/i;

  for( const rawLine of content.split(/\n+/) ) {
    const line = rawLine.trim();
    if( line.length === 0 ) {
      continue;
    }

    const match = line.match( statusRegex );
    if( match ) {
      const [, state, name, verdict ] = match;
      results.push({
        status: state.toUpperCase() === 'OK' ? 'passed' : 'failed',
        name,
        verdict: verdict.toLowerCase(),
      });
      continue;
    }

    if( /Difference inside|Missing|Some new files|Script errored out|Nooo:|An error occurred/i.test( line ) ) {
      extras.push( line );
    }
  }

  return { results, extras };
};

const writeSummary = async ( lines ) => {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if( summaryFile ) {
    const { appendFile } = await import('node:fs/promises');
    await appendFile( summaryFile, `${ lines.join('\n') }\n`, 'utf8' );
  }
  else {
    console.log( lines.join('\n') );
  }
};

const run = async () => {
  let raw;

  try {
    raw = await readFile( inputPath, 'utf8' );
  }
  catch( error ) {
    console.error(`format-summary: failed to read ${ inputPath }: ${ error.message }`);
    process.exit( 1 );
  }

  const cleaned = stripAnsi( raw );
  const { results, extras } = parseLines( cleaned );

  const passed = results.filter( item => item.status === 'passed' ).length;
  const failed = results.filter( item => item.status === 'failed' ).length;
  const summaryLines = [ `### ${ title }`, '' ];

  if( results.length === 0 ) {
    summaryLines.push(`- ⚠️ No fixture results captured in ${ basename( inputPath ) }.`);
  }
  else {
    summaryLines.push(`- ✅ ${ passed } passed`);
    summaryLines.push(`- ❌ ${ failed } failed`);
  }

  if( failed > 0 ) {
    summaryLines.push('', '#### Failed scenarios');
    for( const failure of results.filter( item => item.status === 'failed' ) ) {
      summaryLines.push(`- ${ failure.name }`);
    }
  }

  if( extras.length > 0 ) {
    summaryLines.push('', '#### Key differences');
    for( const extra of extras.slice(0, 10) ) {
      summaryLines.push(`- ${ extra }`);
    }
    if( extras.length > 10 ) {
      summaryLines.push('- …');
    }
  }

  await writeSummary( summaryLines );
};

run().catch( error => {
  console.error(error);
  process.exit( 1 );
} );
