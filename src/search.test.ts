import assert from 'node:assert/strict';
import { env } from 'node:process';
import { test } from 'node:test';
import { search } from './search.ts';

const { NEIS_API_KEY: apiKey } = env;
if (!apiKey) throw new Error();

test('기본 검색', async () => {
	const result = await search({ filters: { 학교명: '가락고등학교' } }, { apiKey });
	assert.equal(result.ok, true);
	assert.equal(result.code, 'INFO-000');
	assert.ok(result.totalCount > 0);

	const school = result.schools.at(0);
	assert.ok(school);
	assert.equal(school.SCHUL_NM, '가락고등학교');
});

test('검색 시 지정한 필드만 반환', async () => {
	const result = await search(
		{
			filters: { 학교명: '가락고등학교' },
			fields: ['SCHUL_NM', 'ORG_TELNO'],
		},
		{ apiKey },
	);
	assert.equal(result.ok, true);

	const school = result.schools.at(0);
	assert.ok(school);
	assert.deepEqual(Object.keys(school).sort(), ['ORG_TELNO', 'SCHUL_NM']);
});

test('검색 결과가 없는 경우', async () => {
	const result = await search({ filters: { 학교명: 'invalid' } }, { apiKey });
	assert.deepEqual(result, { ok: true, code: 'INFO-200', totalCount: 0, schools: [] });
});

test('잘못된 API 키를 입력한 경우', async () => {
	const result = await search({}, { apiKey: 'invalid' });
	assert.equal(result.ok, false);
	assert.equal(result.code, 'ERROR-290');
});
