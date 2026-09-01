import {
	array,
	integer,
	maxValue,
	minValue,
	number,
	object,
	optional,
	parse,
	pick,
	pipe,
	safeParse,
	strictObject,
	tuple,
} from 'valibot';
import { FILTER_KEY_TO_SEARCH, FILTER_KEYS } from './enums/filter-key.ts';
import type { FailureCode, SuccessCode } from './enums/result-code.ts';
import type { Filters, SchoolFields } from './params.ts';
import { HeadSchema, NoRowsSchema, RawSchoolSchema, SchoolSchema, type School } from './valibot.ts';

type PickedSchool<
	Fields extends SchoolFields,
	S extends School = School, // naked type parameter, so `Pick` distributes over the union
> = [Fields] extends [never] // tuple wrapper checks `Fields` as a whole
	? School
	: S extends unknown // keeps 행정표준코드 narrowed instead of collapsing to `string | null`
		? Pick<S, Fields[number]>
		: never;

export type SearchResult<Fields extends SchoolFields = never> =
	| {
			ok: true;
			code: SuccessCode;
			meta: {
				pageIndex: number;
				pageSize: number;
				totalCount: number;
			};
			schools: PickedSchool<Fields>[];
	  }
	| {
			ok: false;
			code: FailureCode;
			message: string;
	  }
	| {
			ok: false;
			code: null;
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
): Promise<SearchResult<Fields>> => {
	const { pageIndex, pageSize } = parse(
		object({
			pageIndex: optional(pipe(number(), integer(), minValue(0)), 0),
			// ERROR-336 데이터 요청은 한 번에 최대 1,000건을 넘을 수 없습니다.
			pageSize: optional(pipe(number(), integer(), minValue(1), maxValue(1000)), 100),
		}),
		params,
	);

	const url = new URL('https://open.neis.go.kr/hub/schoolInfo');

	url.searchParams.set('Type', 'json');
	url.searchParams.set('KEY', opts.apiKey);
	url.searchParams.set('pIndex', (pageIndex + 1).toString()); // pIndex는 1부터 시작
	url.searchParams.set('pSize', pageSize.toString());

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

	const noRowsResult = safeParse(NoRowsSchema, raw);
	if (noRowsResult.success) {
		const { RESULT } = noRowsResult.output;
		return RESULT.CODE === 'INFO-000' || RESULT.CODE === 'INFO-200'
			? {
					ok: true,
					code: RESULT.CODE,
					meta: { pageIndex, pageSize, totalCount: 0 },
					schools: [],
				}
			: { ok: false, code: RESULT.CODE, message: RESULT.MESSAGE };
	}

	const result = safeParse(
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

	if (!result.success) return { ok: false, code: null };

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
	} = result.output;

	return {
		ok: true,
		code: RESULT.CODE,
		meta: {
			pageIndex,
			pageSize,
			totalCount,
		},
		schools: schools as PickedSchool<Fields>[],
	};
};
