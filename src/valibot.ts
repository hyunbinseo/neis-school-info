import {
	digits,
	entriesFromList,
	fallback,
	type InferOutput,
	isoDate,
	length,
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

const TrimStringAndIsNonEmpty = pipe(string(), trim(), nonEmpty());

const TrimStringAndEmptyToNull = pipe(
	string(),
	trim(),
	transform((v) => v || null),
);

const YYYYMMDDToISODate = pipe(
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
	시도교육청명: TrimStringAndIsNonEmpty,
	행정표준코드: TrimStringAndEmptyToNull,
	학교명: TrimStringAndIsNonEmpty,
	영문학교명: nullable(TrimStringAndEmptyToNull),
	학교종류명: nullable(pipe(TrimStringAndIsNonEmpty, picklist(학교종류명))),
	시도명: TrimStringAndIsNonEmpty,
	관할조직명: TrimStringAndIsNonEmpty,
	설립명: nullable(pipe(TrimStringAndIsNonEmpty, picklist(설립명))),
	도로명우편번호: fallback(nullable(pipe(string(), trim(), digits(), length(5))), null),
	도로명주소: nullable(TrimStringAndIsNonEmpty),
	도로명상세주소: nullable(TrimStringAndEmptyToNull),
	전화번호: TrimStringAndIsNonEmpty,
	홈페이지주소: nullable(TrimStringAndIsNonEmpty),
	남녀공학구분명: pipe(TrimStringAndIsNonEmpty, picklist(남녀공학구분명)),
	팩스번호: nullable(TrimStringAndIsNonEmpty),
	고등학교구분명: nullable(pipe(TrimStringAndIsNonEmpty, picklist(고등학교구분명))),
	산업체특별학급존재여부: picklist(['N', 'Y']),
	고등학교일반전문구분명: nullable(pipe(TrimStringAndIsNonEmpty, picklist(고등학교일반전문구분명))),
	특수목적고등학교계열명: nullable(TrimStringAndIsNonEmpty),
	입시전후기구분명: pipe(TrimStringAndIsNonEmpty, picklist(입시전후기구분명)),
	주야구분명: pipe(TrimStringAndIsNonEmpty, picklist(주야구분명)),
	설립일자: YYYYMMDDToISODate,
	개교기념일: YYYYMMDDToISODate,
	수정일자: YYYYMMDDToISODate,
});
