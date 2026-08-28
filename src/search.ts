import { array, object, parse, pick, pipe, safeParse, strictObject, tuple } from 'valibot';
import { FILTER_KEY_TO_SEARCH, FILTER_KEYS } from './enums/filter-key.ts';
import type { FailureCode, SuccessCode } from './enums/result-code.ts';
import type { Filters, SchoolFields } from './params.ts';
import { HeadSchema, NoRowsSchema, RawSchoolSchema, SchoolSchema, type School } from './valibot.ts';

export type SuccessResult<Fields extends SchoolFields = never> = {
	ok: true;
	code: SuccessCode;
	totalCount: number;
	schools: Array<[Fields] extends [never] ? School : Pick<School, Fields[number]>>;
};

export type FailureResult = {
	ok: false;
	code: FailureCode;
	message: string;
};

export const search = async <const Fields extends SchoolFields = never>(
	params: Partial<{
		pageIndex: number;
		pageSize: number;
		fields: Fields;
		filters: Filters;
	}>,
	opts: {
		apiKey: string;
		fetch?: typeof fetch;
	},
): Promise<SuccessResult<Fields> | FailureResult> => {
	const url = new URL('https://open.neis.go.kr/hub/schoolInfo');

	url.searchParams.set('Type', 'json');
	url.searchParams.set('KEY', opts.apiKey);
	url.searchParams.set('pIndex', ((params.pageIndex ?? 0) + 1).toString()); // 1부터 시작
	url.searchParams.set('pSize', (params.pageSize ?? 100).toString());

	for (const key of FILTER_KEYS) {
		const searchKey = FILTER_KEY_TO_SEARCH[key];
		let value = params.filters?.[key];
		if (value === null && key === '행정표준코드') value = ' '.repeat(7);
		if (!value) continue;
		url.searchParams.set(searchKey, value);
	}

	const response = await (opts.fetch ?? fetch)(url);
	if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

	const raw = await response.json();

	const noRows = safeParse(NoRowsSchema, raw);
	if (noRows.success) {
		const { RESULT } = noRows.output;
		return RESULT.CODE === 'INFO-000' || RESULT.CODE === 'INFO-200'
			? { ok: true, code: RESULT.CODE, totalCount: 0, schools: [] }
			: { ok: false, code: RESULT.CODE, message: RESULT.MESSAGE };
	}

	const {
		schoolInfo: [
			{
				head: [
					{ list_total_count: totalCount }, //
					{ RESULT },
				],
			},
			{ row: schools },
		],
	} = parse(
		strictObject({
			schoolInfo: tuple([
				object({ head: HeadSchema }),
				object({
					row: array(
						pipe(
							RawSchoolSchema,
							params.fields //
								? pick(SchoolSchema, params.fields)
								: SchoolSchema,
						),
					),
				}),
			]),
		}),
		raw,
	);

	return {
		ok: true,
		code: RESULT.CODE,
		totalCount,
		schools,
	} as SuccessResult<Fields>;
};
