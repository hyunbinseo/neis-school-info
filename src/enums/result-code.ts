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
