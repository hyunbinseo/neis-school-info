export const FILTER_KEY_TO_SEARCH = {
	시도교육청코드: 'ATPT_OFCDC_SC_CODE',
	행정표준코드: 'SD_SCHUL_CODE',
	학교명: 'SCHUL_NM',
	학교종류명: 'SCHUL_KND_SC_NM',
	시도명: 'LCTN_SC_NM',
	설립명: 'FOND_SC_NM',
} as const;

export type FilterKey = keyof typeof FILTER_KEY_TO_SEARCH;
export const FILTER_KEYS = Object.keys(FILTER_KEY_TO_SEARCH) as FilterKey[];
