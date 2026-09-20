import test from 'node:test';
import assert from 'node:assert/strict';
import { ValidationError } from '../src/errors/index.js';
import { equipmentPayload, requestPayload, validateListQuery } from '../src/validators/index.js';

test('equipment validator ignores unknown and protected fields', () => {
  const value = equipmentPayload({ name: 'Turbine A-01', type: 'turbine', serialNumber: 'WT-001', location: { lat: 56.84, lon: 60.61 }, installedAt: '2025-01-01', id: 'client-id' });
  assert.equal(value.id, undefined);
  assert.equal(value.name, 'Turbine A-01');
});

test('validators report invalid fields as validation errors', () => {
  assert.throws(() => requestPayload({ equipmentId: '', title: 'bad', priority: 'urgent' }), ValidationError);
  assert.throws(() => validateListQuery({ page: 0, status: 'unknown' }, ['status', 'priority']), ValidationError);
});
