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
import {
	FAILURE_CODES,
	type EnSchoolField,
	OFFICE_CODES,
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

const NormalizeStringSchema = pipe(
	string(),
	transform((v: string) => v.replaceAll(/\s+/g, ' ')), // e.g. NBSP in 'Kangnam Elementary School'
	trim(),
);

const NonEmptyStringSchema = pipe(NormalizeStringSchema, nonEmpty());

const StringEmptyToNullSchema = pipe(
	NormalizeStringSchema,
	transform((v) => v || null),
);

// NOTE `nullable` is needed to assign `null` as the `fallback()` value
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
			NonEmptyStringSchema, // e.g. leading BOM in '﻿﻿http://school.cbe.go.kr/gagok-e/'
			transform((v) => v.replaceAll(' ', '')), // e.g. 'http://ya-seochang. jge.es.kr'
			// NOTE A public domain has a dot (name.tld); rare exceptions can be ignored
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

const 학교종류명 = [
	'초등학교',
	'중학교',
	'고등학교',
	'특수학교',
	'고등기술학교',
	'고등공민학교',
	'공동실습소',
	'국제학교',
	'외국인학교',
	'방송통신중학교',
	'방송통신고등학교',
	'각종학교(초)',
	'각종학교(중)',
	'각종학교(고)',
	'각종학교(대안학교)',
	'각종학교(외국인학교)',
	'평생학교(초)-3년6학기',
	'평생학교(초)-4년12학기',
	'평생학교(중)-2년6학기',
	'평생학교(중)-3년6학기',
	'평생학교(고)-2년6학기',
	'평생학교(고)-3년6학기',
	'재외한국학교(초)',
	'재외한국학교(중)',
	'재외한국학교(고)',
] as const;

const 고등학교구분명 = ['일반고', '특성화고', '자율고', '특목고'] as const;
const 고등학교일반전문구분명 = ['해당없음', '일반계', '전문계'] as const;
const 남녀공학구분명 = ['남여공학', '남', '여'] as const;
const 설립명 = ['공립', '사립', '국립', '기타', '국외'] as const;
const 입시전후기구분명 = ['전기', '후기', '전후기'] as const;
const 주야구분명 = ['주간', '야간', '주야간'] as const;

export type School = InferOutput<typeof SchoolSchema>;
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
	산업체특별학급존재여부: picklist(['N', 'Y']),
	고등학교일반전문구분명: nullable(pipe(NonEmptyStringSchema, picklist(고등학교일반전문구분명))),
	특수목적고등학교계열명: nullable(NonEmptyStringSchema),
	입시전후기구분명: pipe(NonEmptyStringSchema, picklist(입시전후기구분명)),
	주야구분명: pipe(NonEmptyStringSchema, picklist(주야구분명)),
	설립일자: YYYYMMDDToISODateSchema,
	개교기념일: YYYYMMDDToISODateSchema,
	수정일자: YYYYMMDDToISODateSchema,
});
