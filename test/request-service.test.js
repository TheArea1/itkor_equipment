import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryRepository } from '../src/repositories/memory-repository.js';
import { RequestService } from '../src/services/request-service.js';
import { ConflictError } from '../src/errors/index.js';

test('request service applies the permitted status lifecycle', async () => {
  const equipment = new MemoryRepository();
  await equipment.create({ id: 'equipment-1' });
  const service = new RequestService(new MemoryRepository(), equipment);
  const request = await service.create({ equipmentId: 'equipment-1', title: 'Inspect blade surface', priority: 'high' });
  const inProgress = await service.changeStatus(request.id, 'in_progress');
  const completed = await service.changeStatus(request.id, 'done');

  assert.equal(inProgress.status, 'in_progress');
  assert.equal(completed.status, 'done');
  await assert.rejects(() => service.changeStatus(request.id, 'new'), ConflictError);
});
