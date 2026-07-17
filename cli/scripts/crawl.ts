import { deepStrictEqual } from 'node:assert/strict';
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

const 시도_불일치 = result.output.flatMap((school) => {
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

if (시도_불일치.length > 0) console.table(시도_불일치);

const 특목고_불일치 = result.output.flatMap((school) => {
	if ((school.고등학교구분명 === '특목고') === (school.특수목적고등학교계열명 !== null)) return [];
	return {
		학교명: school.학교명,
		행정표준코드: school.행정표준코드,
		고등학교구분명: school.고등학교구분명,
		특수목적고등학교계열명: school.특수목적고등학교계열명,
	};
});

if (특목고_불일치.length > 0) console.table(특목고_불일치);
