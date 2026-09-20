import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryRepository } from '../src/repositories/memory-repository.js';
import { EquipmentService } from '../src/services/equipment-service.js';
import { ConflictError } from '../src/errors/index.js';

const payload = { name: 'Turbine A-01', type: 'turbine', serialNumber: 'WT-001', location: { lat: 56.84, lon: 60.61 }, status: 'operational', installedAt: '2025-01-01' };

test('equipment service creates and filters equipment', async () => {
  const service = new EquipmentService(new MemoryRepository(), new MemoryRepository());
  const equipment = await service.create(payload);
  const result = await service.getAll({ type: 'turbine', page: 1, limit: 20, sortOrder: 'asc' });

  assert.match(equipment.id, /^[\da-f-]{36}$/i);
  assert.equal(result.meta.total, 1);
  assert.equal(result.data[0].serialNumber, 'WT-001');
});

test('equipment service rejects duplicate serial numbers', async () => {
  const service = new EquipmentService(new MemoryRepository(), new MemoryRepository());
  await service.create(payload);
  await assert.rejects(() => service.create({ ...payload, name: 'Turbine B-02' }), ConflictError);
});
