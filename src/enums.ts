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

export const SCHOOL_FIELD_EN_TO_KO = {
	ATPT_OFCDC_SC_CODE: '시도교육청코드',
	ATPT_OFCDC_SC_NM: '시도교육청명',
	SD_SCHUL_CODE: '행정표준코드',
	SCHUL_NM: '학교명',
	ENG_SCHUL_NM: '영문학교명',
	SCHUL_KND_SC_NM: '학교종류명',
	LCTN_SC_NM: '시도명',
	JU_ORG_NM: '관할조직명',
	FOND_SC_NM: '설립명',
	ORG_RDNZC: '도로명우편번호',
	ORG_RDNMA: '도로명주소',
	ORG_RDNDA: '도로명상세주소',
	ORG_TELNO: '전화번호',
	HMPG_ADRES: '홈페이지주소',
	COEDU_SC_NM: '남녀공학구분명',
	ORG_FAXNO: '팩스번호',
	HS_SC_NM: '고등학교구분명',
	INDST_SPECL_CCCCL_EXST_YN: '산업체특별학급존재여부',
	HS_GNRL_BUSNS_SC_NM: '고등학교일반전문구분명',
	SPCLY_PURPS_HS_ORD_NM: '특수목적고등학교계열명',
	ENE_BFE_SEHF_SC_NM: '입시전후기구분명',
	DGHT_SC_NM: '주야구분명',
	FOND_YMD: '설립일자',
	FOAS_MEMRD: '개교기념일',
	LOAD_DTM: '수정일자',
} as const;

export type EnSchoolField = keyof typeof SCHOOL_FIELD_EN_TO_KO;
export const EN_SCHOOL_FIELDS = Object.keys(SCHOOL_FIELD_EN_TO_KO) as EnSchoolField[];

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
