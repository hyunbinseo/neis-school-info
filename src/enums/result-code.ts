export type SuccessCode = (typeof SUCCESS_CODES)[number];
export const SUCCESS_CODES = [
	'INFO-000', // 정상 처리되었습니다.
	'INFO-200', // 해당하는 데이터가 없습니다.
] as const;

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
