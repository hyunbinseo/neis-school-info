import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { env } from 'node:process';
import { search } from '#src/index.ts';
import type { SuccessResult } from '#src/search.ts';

const PAGE_SIZE = 1000;

const { NEIS_API_KEY: apiKey } = env;
if (!apiKey) throw new Error();

const schools: SuccessResult['schools'] = [];

let pageIndex = 0;
while (true) {
	const result = await search({ pageIndex, pageSize: PAGE_SIZE }, { apiKey });
	if (!result.ok) {
		console.error(
			`Partial crawl: stopped at ${schools.length} schools (${result.code} ${result.message})`,
		);
		break;
	}

	schools.push(...result.schools);
	const total = result.totalCount;
	console.log(`${schools.length.toString().padStart(total.toString().length, ' ')} / ${total}`);
	if (schools.length >= total) break;
	pageIndex += 1;
}

writeFileSync(
	join(import.meta.dirname, `crawled-${Date.now()}.json`),
	JSON.stringify(schools, null, '\t') + '\n',
);
