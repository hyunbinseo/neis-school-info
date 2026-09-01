import {
	check,
	digits,
	entriesFromList,
	fallback,
	type InferOutput,
	isoDate,
	length,
	maxLength,
	minLength,
	nonEmpty,
	nullable,
	number,
	object,
	picklist,
	pipe,
	strictObject,
	string,
	transform,
	trim,
	tuple,
	unknown,
	url,
} from 'valibot';
import { type YN, YN_VALUES } from './enums/misc.ts';
import { OFFICE_CODES, type 시도교육청코드 } from './enums/office-code.ts';
import { FAILURE_CODES, SUCCESS_CODES } from './enums/result-code.ts';
import {
	EN_SCHOOL_FIELDS,
	SCHOOL_FIELD_EN_TO_KO,
	type EnSchoolField,
} from './enums/school-field.ts';
import {
	고등학교구분명,
	고등학교일반전문구분명,
	남녀공학구분명,
	설립명,
	입시전후기구분명,
	주야구분명,
	학교종류명,
} from './enums/school-value.ts';

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

const NormalizeStringSchema = pipe(
	string(),
	// oxlint-disable-next-line no-irregular-whitespace
	transform((v: string) => v.replaceAll(/\s+/g, ' ')), // e.g. NBSP in 'Kangnam Elementary School'
	trim(),
);

const NonEmptyStringSchema = pipe(NormalizeStringSchema, nonEmpty());

const StringEmptyToNullSchema = pipe(
	NormalizeStringSchema,
	transform((v) => v || null),
);

// `nullable` is needed to assign `null` as the `fallback()` value.
const PhoneNumberSchema = fallback(
	nullable(
		pipe(
			NonEmptyStringSchema,
			transform((v) => v.replaceAll(/[() .+-]/g, '')), // e.g. 054--475-5386, +82-2-1234-5678
			digits(),
			minLength(8), // e.g. 15995789; intentionally drops 032114, etc.
			maxLength(15), // E.164 max
			check((v) => !/^(\d)\1+$/.test(v)), // e.g. 000-0000-0000
		),
	),
	null,
);

const URLSchema = fallback(
	nullable(
		pipe(
			// oxlint-disable-next-line no-irregular-whitespace
			NonEmptyStringSchema, // e.g. leading BOM in '﻿﻿http://school.cbe.go.kr/gagok-e/'
			transform((v) => v.replaceAll(' ', '')), // e.g. 'http://ya-seochang. jge.es.kr'
			// A public domain has a dot (name.tld); rare exceptions can be ignored.
			check((v) => v.includes('.')), // e.g. '강원도 정선군 여량면 여량7길 42' is not a URL
			transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`)),
			minLength(11), // e.g. http://x.io; the shortest technically valid URL
			url(),
		),
	),
	null,
);

const YYYYMMDDToISODateSchema = pipe(
	string(),
	trim(),
	digits(),
	length(8),
	transform((v) => `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6)}`),
	isoDate(),
);

export const SchoolSchema = object({
	시도교육청코드: picklist(OFFICE_CODES),
	시도교육청명: NonEmptyStringSchema,
	행정표준코드: StringEmptyToNullSchema,
	학교명: NonEmptyStringSchema,
	영문학교명: nullable(StringEmptyToNullSchema),
	학교종류명: nullable(pipe(NonEmptyStringSchema, picklist(학교종류명))),
	시도명: NonEmptyStringSchema,
	관할조직명: NonEmptyStringSchema,
	설립명: nullable(pipe(NonEmptyStringSchema, picklist(설립명))),
	도로명우편번호: fallback(nullable(pipe(string(), trim(), digits(), length(5))), null),
	도로명주소: nullable(NonEmptyStringSchema),
	도로명상세주소: nullable(StringEmptyToNullSchema),
	전화번호: PhoneNumberSchema,
	홈페이지주소: URLSchema,
	남녀공학구분명: pipe(NonEmptyStringSchema, picklist(남녀공학구분명)),
	팩스번호: PhoneNumberSchema,
	고등학교구분명: nullable(pipe(NonEmptyStringSchema, picklist(고등학교구분명))),
	산업체특별학급존재여부: picklist(YN_VALUES),
	고등학교일반전문구분명: nullable(pipe(NonEmptyStringSchema, picklist(고등학교일반전문구분명))),
	특수목적고등학교계열명: nullable(NonEmptyStringSchema),
	입시전후기구분명: pipe(NonEmptyStringSchema, picklist(입시전후기구분명)),
	주야구분명: pipe(NonEmptyStringSchema, picklist(주야구분명)),
	설립일자: YYYYMMDDToISODateSchema,
	개교기념일: YYYYMMDDToISODateSchema,
	수정일자: YYYYMMDDToISODateSchema,
});

// See https://github.com/open-circle/valibot/issues/1518#issuecomment-5490218549
export type School = {
	시도교육청코드: 시도교육청코드;
	시도교육청명: string;
	학교명: string;
	영문학교명: string | null;
	학교종류명: 학교종류명 | null;
	시도명: string;
	관할조직명: string;
	설립명: 설립명 | null;
	도로명우편번호: string | null;
	도로명주소: string | null;
	도로명상세주소: string | null;
	전화번호: string | null;
	홈페이지주소: string | null;
	남녀공학구분명: 남녀공학구분명;
	팩스번호: string | null;
	고등학교구분명: 고등학교구분명 | null;
	산업체특별학급존재여부: YN;
	고등학교일반전문구분명: 고등학교일반전문구분명 | null;
	특수목적고등학교계열명: string | null;
	입시전후기구분명: 입시전후기구분명;
	주야구분명: 주야구분명;
	설립일자: string;
	개교기념일: string;
	수정일자: string;
} &
	// A union so `Array#filter` can narrow it.
	({ 행정표준코드: string } | { 행정표준코드: null });

type IsMutuallyAssignable<A, B> = A extends B ? (B extends A ? true : false) : false;
type Expect<T extends true> = T;

// @ts-expect-error
// oxlint-disable-next-line no-unused-vars
type SchoolMatchesInferredSchema = Expect<
	IsMutuallyAssignable<
		Omit<School, '행정표준코드'> & { 행정표준코드: string | null },
		InferOutput<typeof SchoolSchema>
	>
>;
