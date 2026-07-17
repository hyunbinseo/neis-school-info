import {
	entriesFromList,
	type InferOutput,
	nullable,
	number,
	object,
	picklist,
	pipe,
	strictObject,
	string,
	transform,
	tuple,
	unknown,
} from 'valibot';
import {
	FAILURE_CODES,
	type EnSchoolField,
	SCHOOL_FIELD_EN_TO_KO,
	EN_SCHOOL_FIELDS,
	SUCCESS_CODES,
} from './enums.ts';

export const NoRowsSchema = strictObject({
	RESULT: object({
		CODE: picklist([...SUCCESS_CODES, ...FAILURE_CODES]),
		MESSAGE: string(),
	}),
});

export const HeadSchema = tuple([
	object({ list_total_count: number() }), //
	object({
		RESULT: object({
			CODE: picklist(SUCCESS_CODES),
			MESSAGE: string(),
		}),
	}),
]);

export const RawSchoolSchema = pipe(
	strictObject(entriesFromList(EN_SCHOOL_FIELDS, unknown())),
	transform((v) =>
		Object.fromEntries(
			Object.entries(v).map(([enKey, value]) => [
				SCHOOL_FIELD_EN_TO_KO[enKey as EnSchoolField],
				value,
			]),
		),
	),
);

export type School = InferOutput<typeof SchoolSchema>;
export const SchoolSchema = object({
	시도교육청코드: nullable(string()),
	시도교육청명: nullable(string()),
	행정표준코드: nullable(string()),
	학교명: string(),
	영문학교명: nullable(string()),
	학교종류명: nullable(string()),
	시도명: string(),
	관할조직명: string(),
	설립명: nullable(string()),
	도로명우편번호: nullable(string()),
	도로명주소: nullable(string()),
	도로명상세주소: nullable(string()),
	전화번호: string(),
	홈페이지주소: nullable(string()),
	남녀공학구분명: string(),
	팩스번호: nullable(string()),
	고등학교구분명: nullable(string()),
	산업체특별학급존재여부: picklist(['N', 'Y']),
	고등학교일반전문구분명: nullable(string()),
	특수목적고등학교계열명: nullable(string()),
	입시전후기구분명: string(),
	주야구분명: string(),
	설립일자: string(),
	개교기념일: string(),
	수정일자: string(),
});
