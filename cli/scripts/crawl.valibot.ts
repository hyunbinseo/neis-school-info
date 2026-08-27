import { is } from 'valibot';
import {
	EN_SCHOOL_FIELDS,
	SCHOOL_FIELD_EN_TO_KO,
	type EnSchoolField,
} from '#src/enums/school-field.ts';
import { SchoolSchema } from '#src/valibot.ts';

type FieldCharacteristic = Record<'canBeNull' | 'canBeEmpty', boolean>;
export type FieldCharacteristics = Record<EnSchoolField, FieldCharacteristic>;

export const EXPECTED_FIELD_CHARACTERISTICS: Partial<FieldCharacteristics> = Object.fromEntries(
	EN_SCHOOL_FIELDS.flatMap<[EnSchoolField, FieldCharacteristic]>((enField) => {
		const entry = SchoolSchema.entries[SCHOOL_FIELD_EN_TO_KO[enField]];
		if ('fallback' in entry) return []; // skip fields with fallback
		return [[enField, { canBeNull: is(entry, null), canBeEmpty: is(entry, '  ') }]];
	}),
);
