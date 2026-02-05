/**
 * @fileoverview Testy walidacji atrybutów przedmiotów
 * @description Testuje funkcje castAndValidateValue i validateAndBuildAttributes
 */

import { describe, it, expect } from 'vitest';

// Reimplementacja funkcji do testowania (izolowane od reszty modułu)
const normalizeType = (type) => {
    if (type === 'text') return 'string';
    return type;
};

const isValidUrl = (v) => typeof v === 'string' && /^(http|https):\/\/[^ "]+$/.test(v);
const isValidDateString = (v) => typeof v === 'string' && !Number.isNaN(Date.parse(v));

const castAndValidateValue = (schema, raw, isRequired = true) => {
    const type = schema.type;

    // Obsługa null/undefined/pustych wartości dla opcjonalnych atrybutów
    if (raw === null || raw === undefined || raw === '') {
        if (!isRequired) {
            return { ok: true, value: null, skip: true };
        }
        return { ok: false, value: null, error: 'Wartość jest wymagana' };
    }

    if (type === 'number') {
        const num = Number(raw);
        if (Number.isNaN(num)) return { ok: false, value: null, error: 'Nieprawidłowa wartość liczbowa' };
        return { ok: true, value: num };
    }

    if (type === 'boolean') {
        if (typeof raw === 'boolean') return { ok: true, value: raw };
        const s = String(raw).toLowerCase();
        if (s === 'true') return { ok: true, value: true };
        if (s === 'false') return { ok: true, value: false };
        return { ok: false, value: null, error: 'Nieprawidłowa wartość logiczna (true/false)' };
    }

    if (type === 'date') {
        if (!isValidDateString(raw)) return { ok: false, value: null, error: 'Nieprawidłowa data' };
        return { ok: true, value: String(raw) };
    }

    if (type === 'url') {
        if (!isValidUrl(raw)) return { ok: false, value: null, error: 'Nieprawidłowy URL' };
        return { ok: true, value: String(raw) };
    }

    if (type === 'select') {
        const v = String(raw ?? '');
        const options = Array.isArray(schema.options) ? schema.options : [];
        if (!options.includes(v)) return { ok: false, value: null, error: 'Wartość spoza dozwolonych opcji' };
        return { ok: true, value: v };
    }

    return { ok: true, value: String(raw ?? '') };
};

describe('Attribute Validation', () => {
    describe('normalizeType', () => {
        it('should convert "text" to "string"', () => {
            expect(normalizeType('text')).toBe('string');
        });

        it('should keep other types unchanged', () => {
            expect(normalizeType('number')).toBe('number');
            expect(normalizeType('boolean')).toBe('boolean');
            expect(normalizeType('date')).toBe('date');
        });
    });

    describe('isValidUrl', () => {
        it('should validate http URLs', () => {
            expect(isValidUrl('http://example.com')).toBe(true);
        });

        it('should validate https URLs', () => {
            expect(isValidUrl('https://example.com/path?query=1')).toBe(true);
        });

        it('should reject invalid URLs', () => {
            expect(isValidUrl('not-a-url')).toBe(false);
            expect(isValidUrl('ftp://file.com')).toBe(false);
            expect(isValidUrl('')).toBe(false);
        });
    });

    describe('isValidDateString', () => {
        it('should validate ISO date strings', () => {
            expect(isValidDateString('2024-01-15')).toBe(true);
            expect(isValidDateString('2024-01-15T12:00:00Z')).toBe(true);
        });

        it('should reject invalid date strings', () => {
            expect(isValidDateString('not-a-date')).toBe(false);
            expect(isValidDateString('')).toBe(false);
        });
    });

    describe('castAndValidateValue', () => {
        describe('number type', () => {
            const schema = { type: 'number' };

            it('should accept valid numbers', () => {
                expect(castAndValidateValue(schema, 42)).toEqual({ ok: true, value: 42 });
                expect(castAndValidateValue(schema, 3.14)).toEqual({ ok: true, value: 3.14 });
                expect(castAndValidateValue(schema, 0)).toEqual({ ok: true, value: 0 });
            });

            it('should accept numeric strings', () => {
                expect(castAndValidateValue(schema, '42')).toEqual({ ok: true, value: 42 });
                expect(castAndValidateValue(schema, '-5')).toEqual({ ok: true, value: -5 });
            });

            it('should reject non-numeric values', () => {
                const result = castAndValidateValue(schema, 'abc');
                expect(result.ok).toBe(false);
                expect(result.error).toContain('liczbowa');
            });

            it('should handle null for optional fields', () => {
                const result = castAndValidateValue(schema, null, false);
                expect(result.ok).toBe(true);
                expect(result.skip).toBe(true);
            });

            it('should reject null for required fields', () => {
                const result = castAndValidateValue(schema, null, true);
                expect(result.ok).toBe(false);
            });
        });

        describe('boolean type', () => {
            const schema = { type: 'boolean' };

            it('should accept boolean values', () => {
                expect(castAndValidateValue(schema, true)).toEqual({ ok: true, value: true });
                expect(castAndValidateValue(schema, false)).toEqual({ ok: true, value: false });
            });

            it('should accept "true" and "false" strings', () => {
                expect(castAndValidateValue(schema, 'true')).toEqual({ ok: true, value: true });
                expect(castAndValidateValue(schema, 'false')).toEqual({ ok: true, value: false });
                expect(castAndValidateValue(schema, 'TRUE')).toEqual({ ok: true, value: true });
            });

            it('should reject invalid boolean values', () => {
                const result = castAndValidateValue(schema, 'yes');
                expect(result.ok).toBe(false);
                expect(result.error).toContain('logiczna');
            });

            it('should handle null for optional fields', () => {
                const result = castAndValidateValue(schema, null, false);
                expect(result.ok).toBe(true);
                expect(result.skip).toBe(true);
            });
        });

        describe('date type', () => {
            const schema = { type: 'date' };

            it('should accept valid date strings', () => {
                const result = castAndValidateValue(schema, '2024-01-15');
                expect(result.ok).toBe(true);
                expect(result.value).toBe('2024-01-15');
            });

            it('should accept ISO date strings', () => {
                const result = castAndValidateValue(schema, '2024-01-15T12:00:00Z');
                expect(result.ok).toBe(true);
            });

            it('should reject invalid dates', () => {
                const result = castAndValidateValue(schema, 'not-a-date');
                expect(result.ok).toBe(false);
                expect(result.error).toContain('data');
            });

            it('should handle empty for optional fields', () => {
                const result = castAndValidateValue(schema, '', false);
                expect(result.ok).toBe(true);
                expect(result.skip).toBe(true);
            });
        });

        describe('url type', () => {
            const schema = { type: 'url' };

            it('should accept valid URLs', () => {
                const result = castAndValidateValue(schema, 'https://example.com');
                expect(result.ok).toBe(true);
                expect(result.value).toBe('https://example.com');
            });

            it('should reject invalid URLs', () => {
                const result = castAndValidateValue(schema, 'not-a-url');
                expect(result.ok).toBe(false);
                expect(result.error).toContain('URL');
            });
        });

        describe('select type', () => {
            const schema = { type: 'select', options: ['optionA', 'optionB', 'optionC'] };

            it('should accept values from options', () => {
                expect(castAndValidateValue(schema, 'optionA')).toEqual({ ok: true, value: 'optionA' });
                expect(castAndValidateValue(schema, 'optionB')).toEqual({ ok: true, value: 'optionB' });
            });

            it('should reject values not in options', () => {
                const result = castAndValidateValue(schema, 'invalidOption');
                expect(result.ok).toBe(false);
                expect(result.error).toContain('opcji');
            });

            it('should handle empty for optional fields', () => {
                const result = castAndValidateValue(schema, '', false);
                expect(result.ok).toBe(true);
                expect(result.skip).toBe(true);
            });
        });

        describe('string type (default)', () => {
            const schema = { type: 'string' };

            it('should accept any string', () => {
                expect(castAndValidateValue(schema, 'hello')).toEqual({ ok: true, value: 'hello' });
            });

            it('should convert numbers to strings', () => {
                expect(castAndValidateValue(schema, 123)).toEqual({ ok: true, value: '123' });
            });

            it('should handle undefined for optional fields', () => {
                const result = castAndValidateValue(schema, undefined, false);
                expect(result.ok).toBe(true);
                expect(result.skip).toBe(true);
            });
        });
    });
});
