import {
	type InferOutput,
	nullable,
	number,
	object,
	picklist,
	strictObject,
	string,
	tuple,
} from 'valibot';
import { FAILURE_CODES, SUCCESS_CODES } from './enums.ts';

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

export type School = InferOutput<typeof SchoolSchema>;
export const SchoolSchema = object({
	ATPT_OFCDC_SC_CODE: nullable(string()),
	ATPT_OFCDC_SC_NM: nullable(string()),
	SD_SCHUL_CODE: nullable(string()),
	SCHUL_NM: string(),
	ENG_SCHUL_NM: nullable(string()),
	SCHUL_KND_SC_NM: nullable(string()),
	LCTN_SC_NM: string(),
	JU_ORG_NM: string(),
	FOND_SC_NM: nullable(string()),
	ORG_RDNZC: nullable(string()),
	ORG_RDNMA: nullable(string()),
	ORG_RDNDA: nullable(string()),
	ORG_TELNO: string(),
	HMPG_ADRES: nullable(string()),
	COEDU_SC_NM: string(),
	ORG_FAXNO: nullable(string()),
	HS_SC_NM: nullable(string()),
	INDST_SPECL_CCCCL_EXST_YN: picklist(['N', 'Y']),
	HS_GNRL_BUSNS_SC_NM: nullable(string()),
	SPCLY_PURPS_HS_ORD_NM: nullable(string()),
	ENE_BFE_SEHF_SC_NM: string(),
	DGHT_SC_NM: string(),
	FOND_YMD: string(),
	FOAS_MEMRD: string(),
	LOAD_DTM: string(),
});
