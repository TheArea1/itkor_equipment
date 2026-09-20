import { randomUUID } from 'node:crypto';
import { ConflictError, NotFoundError } from '../errors/index.js';

const transitions = { new: ['in_progress', 'rejected'], in_progress: ['done', 'rejected'], done: [], rejected: [] };
export class RequestService {
  constructor(repository, equipmentRepository) { this.repository = repository; this.equipmentRepository = equipmentRepository; }
  async getById(id) { const item = await this.repository.findById(id); if (!item) throw new NotFoundError('Заявка'); return item; }
  async getAll(query) {
    let items = await this.repository.findAll();
    for (const key of ['status', 'priority', 'equipmentId']) if (query[key]) items = items.filter((item) => item[key] === query[key]);
    if (query.fromDate) items = items.filter((item) => item.createdAt >= query.fromDate);
    if (query.toDate) items = items.filter((item) => item.createdAt <= query.toDate);
    const allowedSort = ['createdAt', 'updatedAt', 'plannedAt', 'priority', 'status', 'title'];
    const sortBy = allowedSort.includes(query.sortBy) ? query.sortBy : 'createdAt';
    items.sort((a, b) => String(a[sortBy] ?? '').localeCompare(String(b[sortBy] ?? '')) * (query.sortOrder === 'desc' ? -1 : 1));
    const total = items.length;
    return { data: items.slice((query.page - 1) * query.limit, query.page * query.limit), meta: { total, page: query.page, limit: query.limit } };
  }
  async getByEquipmentId(equipmentId, query) {
    if (!await this.equipmentRepository.findById(equipmentId)) throw new NotFoundError('Оборудование');
    return this.getAll({ ...query, equipmentId });
  }
  async create(payload) {
    if (!await this.equipmentRepository.findById(payload.equipmentId)) throw new NotFoundError('Оборудование');
    const now = new Date().toISOString();
    return this.repository.create({ id: randomUUID(), description: '', plannedAt: null, status: 'new', ...payload, createdAt: now, updatedAt: now });
  }
  async update(id, payload) { await this.getById(id); return this.repository.update(id, { ...payload, updatedAt: new Date().toISOString() }); }
  async changeStatus(id, status) {
    const request = await this.getById(id);
    if (!transitions[request.status].includes(status)) throw new ConflictError(`Переход ${request.status} → ${status} запрещён`);
    return this.repository.update(id, { status, updatedAt: new Date().toISOString() });
  }
  async delete(id) { await this.getById(id); await this.repository.delete(id); }
}
