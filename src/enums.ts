export type SuccessCode = (typeof SUCCESS_CODES)[number];
export const SUCCESS_CODES = ['INFO-000', 'INFO-200'] as const;

export type FailureCode = (typeof FAILURE_CODES)[number];
export const FAILURE_CODES = [
	'ERROR-300',
	'ERROR-290',
	'ERROR-310',
	'ERROR-333',
	'ERROR-336',
	'ERROR-337',
	'ERROR-500',
	'ERROR-600',
	'ERROR-601',
	'INFO-100',
	'INFO-300',
] as const;

export type OfficeCode = (typeof OFFICE_CODES)[number];
export const OFFICE_CODES = [
	'B10',
	'C10',
	'D10',
	'E10',
	'F10',
	'G10',
	'H10',
	'I10',
	'J10',
	'K10',
	'M10',
	'N10',
	'P10',
	'Q10',
	'R10',
	'S10',
	'T10',
	'V10',
] as const;

export type SchoolField = (typeof SCHOOL_FIELDS)[number];
export const SCHOOL_FIELDS = [
	'ATPT_OFCDC_SC_CODE',
	'ATPT_OFCDC_SC_NM',
	'SD_SCHUL_CODE',
	'SCHUL_NM',
	'ENG_SCHUL_NM',
	'SCHUL_KND_SC_NM',
	'LCTN_SC_NM',
	'JU_ORG_NM',
	'FOND_SC_NM',
	'ORG_RDNZC',
	'ORG_RDNMA',
	'ORG_RDNDA',
	'ORG_TELNO',
	'HMPG_ADRES',
	'COEDU_SC_NM',
	'ORG_FAXNO',
	'HS_SC_NM',
	'INDST_SPECL_CCCCL_EXST_YN',
	'HS_GNRL_BUSNS_SC_NM',
	'SPCLY_PURPS_HS_ORD_NM',
	'ENE_BFE_SEHF_SC_NM',
	'DGHT_SC_NM',
	'FOND_YMD',
	'FOAS_MEMRD',
	'LOAD_DTM',
] as const;

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
