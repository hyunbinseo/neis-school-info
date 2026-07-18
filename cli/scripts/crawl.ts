import { deepStrictEqual } from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { env, exit } from 'node:process';
import { markdownTable } from 'markdown-table';
import { format } from 'oxfmt';
import {
	array,
	entriesFromList,
	object,
	parse,
	pipe,
	safeParse,
	strictObject,
	tuple,
	unknown,
} from 'valibot';
import { EN_SCHOOL_FIELDS, type EnSchoolField } from '#src/enums.ts';
import { HeadSchema, RawSchoolSchema, SchoolSchema } from '#src/valibot.ts';
import { OFFICE_CODE_TO_NAMES } from '../enum.ts';
import { SCHOOL_FIELD_TYPES } from './crawl.valibot.ts';

const PAGE_SIZE = 1000;

const { NEIS_API_KEY: apiKey } = env;
if (!apiKey) throw new Error();

const rawSchools: Record<EnSchoolField, unknown>[] = [];

let pageIndex = 0;
while (true) {
	const url = new URL('https://open.neis.go.kr/hub/schoolInfo');
	url.searchParams.set('Type', 'json');
	url.searchParams.set('KEY', apiKey);
	url.searchParams.set('pIndex', (pageIndex + 1).toString()); // 1부터 시작
	url.searchParams.set('pSize', PAGE_SIZE.toString());

	const response = await fetch(url);
	if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

	const {
		schoolInfo: [{ head }, { row: schools }],
	} = parse(
		strictObject({
			schoolInfo: tuple([
				object({ head: HeadSchema }),
				object({ row: array(object(entriesFromList(EN_SCHOOL_FIELDS, unknown()))) }),
			]),
		}),
		await response.json(),
	);

	rawSchools.push(...schools);

	const total = head[0].list_total_count;
	console.log(`${rawSchools.length.toString().padStart(total.toString().length, ' ')} / ${total}`);
	if (rawSchools.length >= total) break;
	pageIndex += 1;
}

const timestamp = Date.now();

writeFileSync(
	join(import.meta.dirname, `crawled-${timestamp}.raw.json`),
	JSON.stringify(rawSchools, null, '\t') + '\n',
);

const actualFieldCharacteristics = Object.fromEntries(
	EN_SCHOOL_FIELDS.map((field) => {
		let canBeNull = false;
		let canBeBlank = false;
		rawSchools.some((school) => {
			const value = school[field];
			if (value === null) canBeNull = true;
			if (typeof value === 'string' && value.trim() === '') canBeBlank = true;
			return canBeNull && canBeBlank;
		});
		return [field, { canBeNull, canBeBlank }];
	}),
);

deepStrictEqual(actualFieldCharacteristics, SCHOOL_FIELD_TYPES);

const result = safeParse(array(pipe(RawSchoolSchema, SchoolSchema)), rawSchools);

if (!result.success) {
	writeFileSync(
		join(import.meta.dirname, `crawled-${timestamp}.issues.json`),
		JSON.stringify(result.issues, null, '\t') + '\n',
	);
	exit(1);
}

writeFileSync(
	join(import.meta.dirname, `crawled-${timestamp}.parsed.json`),
	JSON.stringify(result.output, null, '\t') + '\n',
);

const issueSections: string[] = [];

type 시도_Header = (typeof 시도_Headers)[number];
const 시도_Headers = [
	'학교명',
	'행정표준코드',
	'시도교육청코드',
	'시도명',
	'시도교육청명',
] as const;

const 시도_불일치 = result.output.flatMap<Record<시도_Header, string | null>>((school) => {
	const [시도명, 시도교육청명] = OFFICE_CODE_TO_NAMES[school.시도교육청코드];
	if (school.시도명 === 시도명 && school.시도교육청명 === 시도교육청명) return [];
	return {
		학교명: school.학교명,
		행정표준코드: school.행정표준코드,
		시도교육청코드: school.시도교육청코드,
		시도명: school.시도명,
		시도교육청명: school.시도교육청명,
	};
});

if (시도_불일치.length > 0) {
	console.table(시도_불일치);
	issueSections.push(
		'## 시도 불일치',
		'시도교육청코드와 시도명·시도교육청명 일치하지 않음',
		markdownTable([
			시도_Headers,
			...시도_불일치.map((row) => 시도_Headers.map((header) => row[header] ?? '')),
		]),
	);
}

type 특목고_Header = (typeof 특목고_Headers)[number];
const 특목고_Headers = [
	'학교명',
	'행정표준코드',
	'고등학교구분명',
	'특수목적고등학교계열명',
] as const;

const 특목고_불일치 = result.output.flatMap<Record<특목고_Header, string | null>>((school) => {
	if ((school.고등학교구분명 === '특목고') === (school.특수목적고등학교계열명 !== null)) return [];
	return {
		학교명: school.학교명,
		행정표준코드: school.행정표준코드,
		고등학교구분명: school.고등학교구분명,
		특수목적고등학교계열명: school.특수목적고등학교계열명,
	};
});

if (특목고_불일치.length > 0) {
	console.table(특목고_불일치);
	issueSections.push(
		'## 특목고 불일치',
		'고등학교구분명이 특목고인데 특수목적고등학교계열명이 없거나, 특목고가 아닌데 있음',
		markdownTable([
			특목고_Headers,
			...특목고_불일치.map((row) => 특목고_Headers.map((header) => row[header] ?? '')),
		]),
	);
}

if (issueSections.length) {
	const title = `데이터 불일치 발견 (${new Date().toISOString().slice(0, 10)})`;
	const body = (await format('issue.md', issueSections.join('\n\n'))).code;

	if (env['GITHUB_ACTIONS'] !== 'true') {
		writeFileSync(
			join(import.meta.dirname, `crawled-${timestamp}.issues.md`),
			`# ${title}\n\n${body}`,
		);
	} else {
		const response = await fetch(
			`https://api.github.com/repos/${env['GITHUB_REPOSITORY']}/issues`,
			{
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${env['GITHUB_TOKEN']}`,
					'Accept': 'application/vnd.github+json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ title, body }),
			},
		);
		if (!response.ok) {
			console.error(await response.text());
			throw new Error(`${response.status} ${response.statusText}`);
		}
	}
}
