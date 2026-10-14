import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import adminRouter from './admin.js';
import Staff from '../../models/Staff.js';
import StaffShift from '../../models/StaffShift.js';
import { adminCookieCsrfMiddleware, authMiddleware, adminMiddleware } from '../../middleware/auth.js';

const id = '507f1f77bcf86cd799439011';
const validStaff = { firstName: 'Ada', lastName: 'Lovelace', phone: '+44 7700 900123' };
const validShift = { staffId: id, date: '2026-10-14', startTime: '09:00', endTime: '17:00', breakMinutes: 30 };
function route(method, path) {
  const found = adminRouter.stack.find((layer) => layer.route?.path === path && layer.route.methods[method]);
  assert.ok(found, `${method} ${path} exists`);
  return found.route;
}
async function request(method, path, { body = {}, query = {}, authenticated = true, headers = {} } = {}) {
  process.env.JWT_SECRET = 'staff-test-secret';
  const token = jwt.sign({ id: 'admin', role: 'admin', type: 'access' }, process.env.JWT_SECRET);
  const req = { method: method.toUpperCase(), body, query, params: { id }, headers: { ...(authenticated ? { authorization: `Bearer ${token}` } : {}), ...headers }, get(name) { return this.headers[name.toLowerCase()]; } };
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
  for (const layer of route(method, path).stack) {
    let next = false;
    await layer.handle(req, res, () => { next = true; });
    if (!next) break;
  }
  return res;
}
function queryDouble(rows, calls) {
  return { sort(value) { calls.sort = value; return this; }, skip(value) { calls.skip = value; return this; }, limit(value) { calls.limit = value; return this; }, select(value) { calls.select = value; return this; }, lean() { return Promise.resolve(rows); } };
}

test('staff and shift endpoints retain authentication and admin authorization middleware', async () => {
  for (const [method, path] of [['get', '/staff'], ['post', '/staff'], ['patch', '/staff/:id'], ['get', '/staff/options'], ['post', '/staff/shifts'], ['patch', '/staff/shifts/:id']]) {
    const handlers = route(method, path).stack.map((layer) => layer.handle);
    assert.deepEqual(handlers.slice(0, 3), [adminCookieCsrfMiddleware, authMiddleware, adminMiddleware]);
    assert.equal((await request(method, path, { authenticated: false })).statusCode, 401);
  }
});

test('staff creation rejects malformed input with field errors before model work', async (t) => {
  const create = t.mock.method(Staff, 'create', async (payload) => payload);
  const response = await request('post', '/staff', { body: { ...validStaff, role: 'owner', hourlyRate: -1 } });
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, 'Please correct the highlighted fields');
  assert.ok(response.body.errors.role);
  assert.ok(response.body.errors.hourlyRate);
  assert.equal(create.mock.callCount(), 0);
});

test('staff creation stores normalized values and returns duplicate email as a conflict', async (t) => {
  const create = t.mock.method(Staff, 'create', async (payload) => ({ _id: id, ...payload }));
  const response = await request('post', '/staff', { body: { ...validStaff, email: ' ADA@Example.com ' } });
  assert.equal(response.statusCode, 201);
  assert.equal(response.body.staff.email, 'ada@example.com');
  create.mock.mockImplementation(async () => { throw Object.assign(new Error('duplicate'), { code: 11000 }); });
  const duplicate = await request('post', '/staff', { body: { ...validStaff, email: 'ada@example.com' } });
  assert.equal(duplicate.statusCode, 409);
  assert.ok(duplicate.body.errors.email);
});

test('staff status-only update preserves unrelated fields and reports duplicate email conflicts', async (t) => {
  const existing = { ...validStaff, email: 'ada@example.com', hourlyRate: 20, status: 'active', toObject() { return { ...this }; }, async save() {} };
  const lookup = t.mock.method(Staff, 'findById', async () => existing);
  const response = await request('patch', '/staff/:id', { body: { status: 'inactive' } });
  assert.equal(response.statusCode, 200);
  assert.equal(existing.status, 'inactive');
  assert.equal(existing.hourlyRate, 20);
  const invalid = await request('patch', '/staff/:id', { body: {} });
  assert.equal(invalid.statusCode, 400);
  assert.equal(lookup.mock.callCount(), 1, 'invalid updates must be rejected before lookup');
  t.mock.method(existing, 'save', async () => { throw Object.assign(new Error('duplicate'), { code: 11000 }); });
  assert.equal((await request('patch', '/staff/:id', { body: { email: 'other@example.com' } })).statusCode, 409);
});

test('staff email-only patch removes an optional email from the stored record', async (t) => {
  const existing = { ...validStaff, email: 'ada@example.com', status: 'active', async save() {} };
  t.mock.method(Staff, 'findById', async () => existing);
  const response = await request('patch', '/staff/:id', { body: { email: ' ' } });
  assert.equal(response.statusCode, 200);
  assert.equal(existing.email, undefined);
});

test('staff lists apply search, filters, bounded pagination, and an allowed stable sort', async (t) => {
  const calls = {};
  const rows = [{ _id: id, ...validStaff }];
  t.mock.method(Staff, 'countDocuments', async (filter) => { calls.countFilter = filter; return 205; });
  t.mock.method(Staff, 'find', (filter) => { calls.filter = filter; return queryDouble(rows, calls); });
  const response = await request('get', '/staff', { query: { page: '2', limit: '999', search: 'Ada.*', role: 'cleaner', status: 'active', sortBy: 'lastName', sortOrder: 'asc' } });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.staff, rows);
  assert.deepEqual(response.body.pagination, { total: 205, page: 2, limit: 100, pages: 3 });
  assert.equal(calls.skip, 100);
  assert.equal(calls.limit, 100);
  assert.deepEqual(calls.sort, { lastName: 1, _id: 1 });
  assert.equal(calls.filter.role, 'cleaner');
  assert.equal(calls.filter.status, 'active');
  assert.equal(calls.filter.$or[0].firstName.$regex.source, 'Ada\\.\\*');
  assert.deepEqual(calls.countFilter, calls.filter);
  const defaults = await request('get', '/staff', { query: { page: '-2', limit: '-1', sortBy: '__proto__', status: 'unknown', role: 'unknown' } });
  assert.equal(defaults.body.pagination.page, 1);
  assert.equal(defaults.body.pagination.limit, 1);
  assert.deepEqual(calls.sort, { createdAt: -1, _id: -1 });
  assert.deepEqual(calls.filter, {});
  assert.equal((await request('get', '/staff')).body.pagination.limit, 20);
});

test('active staff options are bounded, safely projected, and registered before id routes', async (t) => {
  const calls = {};
  const rows = [{ _id: id, ...validStaff, role: 'cleaner', hourlyRate: 20, status: 'active' }];
  t.mock.method(Staff, 'find', (filter) => { calls.filter = filter; return queryDouble(rows, calls); });
  const response = await request('get', '/staff/options', { query: { search: '(Ada)', limit: '1000', page: '9', status: 'inactive' } });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.staff, rows);
  assert.equal(calls.filter.status, 'active');
  assert.equal(calls.limit, 50);
  assert.equal(calls.skip, undefined);
  assert.equal(calls.select, '_id firstName lastName role hourlyRate status');
  assert.deepEqual(calls.sort, { lastName: 1, firstName: 1, _id: 1 });
  assert.equal(calls.filter.$or[0].firstName.$regex.source, '\\(Ada\\)');
  const paths = adminRouter.stack.map((layer) => layer.route?.path);
  assert.ok(paths.indexOf('/staff/options') < paths.indexOf('/staff/:id'));
});

test('shift creation validates first and calculates hours and pay on the server', async (t) => {
  const lookup = t.mock.method(Staff, 'findById', () => ({ lean: async () => ({ _id: id, status: 'active', hourlyRate: 20 }) }));
  t.mock.method(StaffShift, 'create', async (payload) => payload);
  const invalid = await request('post', '/staff/shifts', { body: { ...validShift, payAmount: 1, status: 'invalid' } });
  assert.equal(invalid.statusCode, 400);
  assert.ok(invalid.body.errors.payAmount);
  assert.equal(lookup.mock.callCount(), 0);
  const response = await request('post', '/staff/shifts', { body: validShift });
  assert.equal(response.statusCode, 201);
  assert.equal(response.body.shift.hoursWorked, 7.5);
  assert.equal(response.body.shift.hourlyRateSnapshot, 20);
  assert.equal(response.body.shift.payAmount, 150);
});

test('shift status cannot skip completion or approval before payment', async (t) => {
  const shift = { ...validShift, date: new Date('2026-10-14'), hourlyRateSnapshot: 20, hoursWorked: 7.5, payAmount: 150, status: 'scheduled', async save() {} };
  const save = t.mock.method(shift, 'save', async () => {});
  t.mock.method(StaffShift, 'findById', async () => shift);

  assert.equal((await request('patch', '/staff/shifts/:id', { body: { status: 'paid' } })).statusCode, 400);
  assert.equal((await request('patch', '/staff/shifts/:id', { body: { status: 'approved' } })).statusCode, 400);
  assert.equal(save.mock.callCount(), 0);
  shift.status = 'completed';
  assert.equal((await request('patch', '/staff/shifts/:id', { body: { status: 'paid' } })).statusCode, 400);
  shift.status = 'approved';
  const paid = await request('patch', '/staff/shifts/:id', { body: { status: 'paid' } });
  assert.equal(paid.statusCode, 200);
  assert.ok(shift.approvedAt);
  assert.ok(shift.paidAt);
  assert.equal(save.mock.callCount(), 1);
});

test('shift partial updates validate merged time ordering and paid shifts remain immutable', async (t) => {
  const shift = { ...validShift, date: new Date('2026-10-14'), hourlyRateSnapshot: 20, hoursWorked: 7.5, payAmount: 150, status: 'scheduled', async save() {} };
  const save = t.mock.method(shift, 'save', async () => {});
  t.mock.method(StaffShift, 'findById', async () => shift);
  assert.equal((await request('patch', '/staff/shifts/:id', { body: { endTime: '08:00' } })).statusCode, 400);
  assert.equal(save.mock.callCount(), 0);
  shift.status = 'completed';
  const approved = await request('patch', '/staff/shifts/:id', { body: { status: 'approved' } });
  assert.equal(approved.statusCode, 200);
  assert.ok(shift.approvedAt);
  shift.status = 'paid';
  assert.equal((await request('patch', '/staff/shifts/:id', { body: { status: 'paid', hourlyRateSnapshot: 100 } })).statusCode, 400);
  assert.equal(shift.payAmount, 150);
  assert.equal(save.mock.callCount(), 1);
});

test('staff schema includes the filtering and name ordering compound index', () => {
  assert.ok(Staff.schema.indexes().some(([keys]) => JSON.stringify(keys) === JSON.stringify({ status: 1, role: 1, lastName: 1, firstName: 1 })));
});
