import assert from 'node:assert/strict';
import { env } from 'node:process';
import { test } from 'node:test';
import { FILTER_KEYS } from './enums/filter-key.ts';
import { OFFICE_CODE_TO_NAMES } from './enums/office-code.ts';
import type { Filters } from './params.ts';
import { search, type SearchResult } from './search.ts';

const { NEIS_API_KEY: apiKey } = env;
if (!apiKey) throw new Error();

void test('기본 검색', async () => {
	const result = await search({ filters: { 학교명: '가락고등학교' } }, { apiKey });
	assert.equal(result.ok, true);
	assert.equal(result.code, 'INFO-000');
	assert.ok(result.totalCount > 0);

	const school = result.schools.at(0);
	assert.ok(school);
	assert.equal(school.학교명, '가락고등학교');
});

void test('검색 시 지정한 필드만 반환', async () => {
	const result = await search(
		{
			filters: { 학교명: '가락고등학교' },
			fields: ['학교명', '전화번호'],
		},
		{ apiKey },
	);
	assert.equal(result.ok, true);

	const school = result.schools.at(0);
	assert.ok(school);
	assert.deepEqual(Object.keys(school).sort(), ['전화번호', '학교명']);
});

void test('검색 결과가 없는 경우', async () => {
	const result = await search({ filters: { 학교명: 'invalid' } }, { apiKey });
	assert.deepEqual(result, { ok: true, code: 'INFO-200', totalCount: 0, schools: [] });
});

void test('시도명은 부분 일치 미지원', async () => {
	const partial = await search({ filters: { 시도명: '경기' } }, { apiKey });
	assert.deepEqual(partial, { ok: true, code: 'INFO-200', totalCount: 0, schools: [] });

	const exact = await search({ filters: { 시도명: '경기도' } }, { apiKey });
	assert.equal(exact.ok, true);
	assert.equal(exact.code, 'INFO-000');
	assert.ok(exact.totalCount > 0);
});

void test('시도명, 시도교육청명은 API 반환값 그대로 사용', async () => {
	// 일부 시도명·시도교육청명에는 괄호 표기가 붙는다. (예: 전남광주통합특별시(광주))
	for (const [시도명, 시도교육청명] of Object.values(OFFICE_CODE_TO_NAMES)) {
		// The annotation works around a TS bug: unannotated, this resolves to `any` (TS7022).
		const result: SearchResult = await search({ pageSize: 5, filters: { 시도명 } }, { apiKey });
		assert.equal(result.ok, true);
		assert.equal(result.code, 'INFO-000');
		assert.ok(result.totalCount > 0);
		for (const school of result.schools) {
			assert.equal(school.시도명, 시도명);
			assert.equal(school.시도교육청명, 시도교육청명);
		}
	}
});

void test('학교종류명은 부분 일치 미지원', async () => {
	const partial = await search({ filters: { 학교종류명: '고등' } }, { apiKey });
	assert.deepEqual(partial, { ok: true, code: 'INFO-200', totalCount: 0, schools: [] });

	const exact = await search({ filters: { 학교종류명: '고등학교' } }, { apiKey });
	assert.equal(exact.ok, true);
	assert.equal(exact.code, 'INFO-000');
	assert.ok(exact.totalCount > 0);
});

void test('설립명은 부분 일치 미지원', async () => {
	const partial = await search({ filters: { 설립명: '공' } }, { apiKey });
	assert.deepEqual(partial, { ok: true, code: 'INFO-200', totalCount: 0, schools: [] });

	const exact = await search({ filters: { 설립명: '공립' } }, { apiKey });
	assert.equal(exact.ok, true);
	assert.equal(exact.code, 'INFO-000');
	assert.ok(exact.totalCount > 0);
});

void test('빈 문자열 필터는 제외됨', async () => {
	const [all, ...filtered] = await Promise.all([
		search({ pageSize: 1 }, { apiKey }),
		...FILTER_KEYS.map((key) =>
			search({ pageSize: 1, filters: { [key]: '' } as Filters }, { apiKey }),
		),
	]);
	assert.equal(all.ok, true);
	for (const result of filtered) {
		assert.equal(result.ok, true);
		assert.equal(result.totalCount, all.totalCount);
	}
});

void test('행정표준코드가 없는 학교는 공백 7칸으로 검색', async () => {
	const result = await search(
		{ pageSize: 1, filters: { 행정표준코드: ' '.repeat(7) } },
		{ apiKey },
	);
	assert.equal(result.ok, true);
	assert.equal(result.code, 'INFO-000');
	assert.ok(result.totalCount > 0);

	const school = result.schools.at(0);
	assert.ok(school);
	assert.equal(school.행정표준코드, null);
});

void test('행정표준코드가 없는 학교는 null로도 검색 가능', async () => {
	const [spaces, nullValue] = await Promise.all([
		search({ pageSize: 1, filters: { 행정표준코드: ' '.repeat(7) } }, { apiKey }),
		search({ pageSize: 1, filters: { 행정표준코드: null } }, { apiKey }),
	]);
	assert.equal(spaces.ok, true);
	assert.equal(nullValue.ok, true);
	assert.equal(spaces.totalCount, nullValue.totalCount);
});

void test('행정표준코드로 필터링하면 타입이 string으로 좁혀짐', async () => {
	const result = await search({}, { apiKey });
	assert.equal(result.ok, true);

	const code: string | undefined = result.schools
		.filter((s) => s.행정표준코드 !== null)
		.at(0)?.행정표준코드;

	void code;
});

void test('fields로 필드를 지정해도 행정표준코드 필터링 시 타입이 string으로 좁혀짐', async () => {
	const result = await search({ fields: ['행정표준코드'] }, { apiKey });
	assert.equal(result.ok, true);

	const code: string | undefined = result.schools
		.filter((s) => s.행정표준코드 !== null)
		.at(0)?.행정표준코드;

	void code;
});

void test('잘못된 API 키를 입력한 경우', async () => {
	const result = await search({}, { apiKey: 'invalid' });
	assert.equal(result.ok, false);
	assert.equal(result.code, 'ERROR-290');
});
