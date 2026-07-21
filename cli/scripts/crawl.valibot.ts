import { is } from 'valibot';
import { EN_SCHOOL_FIELDS, SCHOOL_FIELD_EN_TO_KO, type EnSchoolField } from '#src/enums.ts';
import { SchoolSchema } from '#src/valibot.ts';

export const SCHOOL_FIELD_CHARACTERISTICS = Object.fromEntries(
	EN_SCHOOL_FIELDS.map((enField) => {
		const entry = SchoolSchema.entries[SCHOOL_FIELD_EN_TO_KO[enField]];
		return [
			enField,
			{
				canBeNull: is(entry, null),
				canBeBlank: is(entry, '  '),
			},
		];
	}),
) as Record<EnSchoolField, { canBeNull: boolean; canBeBlank: boolean }>;
