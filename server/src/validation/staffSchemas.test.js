import test from 'node:test';
import assert from 'node:assert/strict';

const contracts = await import('./staffSchemas.js').catch(() => null);
const staff = { firstName: 'Ada', lastName: 'Lovelace', phone: '+44 7700 900123' };
const shift = { staffId: '507f1f77bcf86cd799439011', date: '2026-10-14', startTime: '09:00', endTime: '17:00' };
function validate(schema, payload) {
  assert.ok(contracts, 'staff validation contracts must exist');
  return contracts.validatePayload(contracts[schema], payload);
}

test('staff create requires names and phone and collects all field errors', () => {
  assert.deepEqual(Object.keys(validate('staffCreateSchema', {}).errors).sort(), ['firstName', 'lastName', 'phone']);
});

test('staff normalizes whitespace and optional email without coercing malformed values', () => {
  const { value } = validate('staffCreateSchema', { ...staff, firstName: ' Ada ', email: ' ADA@Example.com ' });
  assert.equal(value.firstName, 'Ada');
  assert.equal(value.email, 'ada@example.com');
  assert.equal(validate('staffCreateSchema', { ...staff, email: '  ' }).value.email, undefined);
  for (const email of ['invalid', 'a'.repeat(255)]) assert.ok(validate('staffCreateSchema', { ...staff, email }).errors.email);
  assert.ok(validate('staffCreateSchema', { ...staff, firstName: 123 }).errors.firstName);
});

test('staff rejects unknown enums and fields rather than replacing them', () => {
  for (const [field, value] of Object.entries({ role: 'owner', status: 'deleted', employmentType: 'casual', password: 'secret' })) {
    assert.ok(validate('staffCreateSchema', { ...staff, [field]: value }).errors[field], field);
  }
});

test('staff rates reject invalid precision, values, and out of range amounts', () => {
  for (const hourlyRate of [-1, 'invalid', 10001, 1.234, Infinity]) {
    assert.ok(validate('staffCreateSchema', { ...staff, hourlyRate }).errors.hourlyRate, String(hourlyRate));
  }
  assert.equal(validate('staffCreateSchema', { ...staff, hourlyRate: 10000 }).value.hourlyRate, 10000);
});

test('staff bounds names, contact details, notes, and service areas', () => {
  const invalid = { firstName: 'a'.repeat(61), lastName: '', phone: 'abcdefg', notes: 'n'.repeat(1001), emergencyContactName: 'n'.repeat(121), emergencyContactPhone: '1'.repeat(31), serviceAreas: ['Kent', ' Kent '] };
  const errors = validate('staffCreateSchema', { ...staff, ...invalid }).errors;
  for (const field of Object.keys(invalid)) assert.ok(errors[field], field);
  for (const serviceAreas of [Array(21).fill(0).map((_, i) => `Area ${i}`), ['a'.repeat(81)], ['']]) {
    assert.ok(validate('staffCreateSchema', { ...staff, serviceAreas }).errors.serviceAreas);
  }
  for (const phone of ['123456', '1'.repeat(31)]) assert.ok(validate('staffCreateSchema', { ...staff, phone }).errors.phone);
  assert.ok(validate('staffCreateSchema', { ...staff, phone: '+44 (7700) 900.123-4' }).value);
});

test('availability rejects invalid days, times, ordering, excessive slots, and unknown nested fields', () => {
  const slot = { day: 'monday', startTime: '09:00', endTime: '17:00' };
  assert.ok(validate('staffCreateSchema', { ...staff, availability: [slot] }).value);
  for (const availability of [[{ ...slot, day: 'holiday' }], [{ ...slot, startTime: '24:00' }], [{ ...slot, endTime: '08:00' }], [{ ...slot, startTime: '17:00' }], [{ ...slot, extra: true }], Array(15).fill(slot)]) {
    assert.ok(validate('staffCreateSchema', { ...staff, availability }).errors.availability);
  }
});

test('staff update accepts a single status and requires at least one recognized field', () => {
  assert.deepEqual(validate('staffUpdateSchema', { status: 'inactive' }), { value: { status: 'inactive' } });
  assert.ok(validate('staffUpdateSchema', {}).errors);
  assert.ok(validate('staffUpdateSchema', { unknown: true }).errors.unknown);
});

test('staff email can be cleared in a partial update and normalizes to absence', () => {
  const result = validate('staffUpdateSchema', { email: ' ' });
  assert.ok(result.value);
  assert.equal(result.value.email, undefined);
});

test('staff errors safely include arbitrary unknown property names', () => {
  const result = validate('staffCreateSchema', JSON.parse('{"__proto__":"unexpected"}'));
  assert.ok(Object.hasOwn(result.errors, '__proto__'));
});

test('shift schemas validate identifiers, exact dates, times, breaks, enum, and server-owned fields', () => {
  assert.ok(validate('shiftCreateSchema', shift).value);
  assert.ok(validate('shiftCreateSchema', { ...shift, status: 'paid' }).errors.status);
  assert.ok(validate('shiftCreateSchema', { ...shift, status: 'approved' }).errors.status);
  assert.ok(validate('shiftCreateSchema', { ...shift, status: 'completed' }).value);
  for (const [field, value] of Object.entries({ staffId: 'invalid', quoteId: 'invalid', date: '2026-02-30', startTime: '25:00', endTime: '08:00', breakMinutes: -1, status: 'invalid', hourlyRateSnapshot: -1, location: 'a'.repeat(241), notes: 'a'.repeat(1001), payAmount: 500 })) {
    assert.ok(validate('shiftCreateSchema', { ...shift, [field]: value }).errors[field], field);
  }
  assert.ok(validate('shiftCreateSchema', { ...shift, breakMinutes: 480 }).errors.breakMinutes);
  assert.ok(validate('shiftCreateSchema', { ...shift, breakMinutes: 1.5 }).errors.breakMinutes);
  assert.deepEqual(validate('shiftUpdateSchema', { status: 'approved' }), { value: { status: 'approved' } });
  assert.ok(validate('shiftUpdateSchema', {}).errors);
});
