import type { 시도교육청코드, 시도명 } from './enums/office-code.ts';
import type { School } from './valibot.ts';

export type SchoolField = keyof School;
export type SchoolFields = readonly [SchoolField, ...SchoolField[]];

export type Filters = Partial<{
	시도교육청코드: 시도교육청코드;
	행정표준코드: string;
	학교명: string;
	학교종류명: string;
	시도명: 시도명 | (string & {});
	설립명: string;
}>;
