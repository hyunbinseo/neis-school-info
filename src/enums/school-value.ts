export type 학교종류명 = (typeof 학교종류명)[number];
export const 학교종류명 = [
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

export type 고등학교구분명 = (typeof 고등학교구분명)[number];
export const 고등학교구분명 = ['일반고', '특성화고', '자율고', '특목고'] as const;

export type 고등학교일반전문구분명 = (typeof 고등학교일반전문구분명)[number];
export const 고등학교일반전문구분명 = ['해당없음', '일반계', '전문계'] as const;

export type 남녀공학구분명 = (typeof 남녀공학구분명)[number];
export const 남녀공학구분명 = ['남여공학', '남', '여'] as const;

export type 설립명 = (typeof 설립명)[number];
export const 설립명 = ['공립', '사립', '국립', '기타', '국외'] as const;

export type 입시전후기구분명 = (typeof 입시전후기구분명)[number];
export const 입시전후기구분명 = ['전기', '후기', '전후기'] as const;

export type 주야구분명 = (typeof 주야구분명)[number];
export const 주야구분명 = ['주간', '야간', '주야간'] as const;
