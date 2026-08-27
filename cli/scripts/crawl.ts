import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { env, exit } from 'node:process';
import { markdownTable } from 'markdown-table';
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
import { createIssue, jsonToCodeblock } from '#cli/lib/github-issue.ts';
import { OFFICE_CODE_TO_NAMES } from '#src/enums/office-code.ts';
import { EN_SCHOOL_FIELDS, type EnSchoolField } from '#src/enums/school-field.ts';
import { HeadSchema, RawSchoolSchema, SchoolSchema } from '#src/valibot.ts';
import { EXPECTED_FIELD_CHARACTERISTICS, type FieldCharacteristics } from './crawl.valibot.ts';

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

const now = new Date();

const issueTitle = `데이터 검증 오류 (${now.toISOString().slice(0, 10)})`;
const issueSections: string[] = [];

writeFileSync(
	join(import.meta.dirname, `crawled-${now.getTime()}.raw.json`),
	JSON.stringify(rawSchools, null, '\t') + '\n',
);

const actualFieldCharacteristics = Object.fromEntries(
	EN_SCHOOL_FIELDS.map((field) => {
		let canBeNull = false;
		let canBeEmpty = false;
		rawSchools.some((school) => {
			const value = school[field];
			if (value === null) canBeNull = true;
			if (typeof value === 'string' && value.trim() === '') canBeEmpty = true;
			return canBeNull && canBeEmpty;
		});
		return [field, { canBeNull, canBeEmpty }];
	}),
) as FieldCharacteristics;

const 필드_불일치 = EN_SCHOOL_FIELDS.flatMap((field) => {
	const expected = EXPECTED_FIELD_CHARACTERISTICS[field];
	if (!expected) return [];
	const actual = actualFieldCharacteristics[field];
	if (
		actual.canBeNull === expected.canBeNull && //
		actual.canBeEmpty === expected.canBeEmpty
	) {
		return [];
	}
	return { field, actual, expected };
});

if (필드_불일치.length > 0) {
	issueSections.push('## 필드 특성 불일치', jsonToCodeblock(필드_불일치));
}

const result = safeParse(array(pipe(RawSchoolSchema, SchoolSchema)), rawSchools);

if (!result.success) {
	writeFileSync(
		join(import.meta.dirname, `crawled-${now.getTime()}.issues.json`),
		JSON.stringify(result.issues, null, '\t') + '\n',
	);

	issueSections.push('## 스키마 파싱 실패', jsonToCodeblock(result.issues));

	await createIssue(
		issueTitle,
		issueSections,
		join(import.meta.dirname, `crawled-${now.getTime()}.issues.md`),
	);

	exit(1);
}

writeFileSync(
	join(import.meta.dirname, `crawled-${now.getTime()}.parsed.json`),
	JSON.stringify(result.output, null, '\t') + '\n',
);

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

if (issueSections.length) {
	await createIssue(
		issueTitle,
		issueSections,
		join(import.meta.dirname, `crawled-${now.getTime()}.issues.md`),
	);
}
