import { randomUUID } from 'node:crypto';
import { ConflictError, NotFoundError } from '../errors/index.js';

const list = (items, query, filters) => {
  let result = items.filter((item) => filters.every(([key]) => !query[key] || item[key] === query[key]));
  const { fromDate, toDate } = query;
  if (fromDate) result = result.filter((item) => item.installedAt >= fromDate);
  if (toDate) result = result.filter((item) => item.installedAt <= toDate);
  const allowedSort = ['name', 'type', 'status', 'serialNumber', 'installedAt'];
  const sortBy = allowedSort.includes(query.sortBy) ? query.sortBy : 'name';
  result.sort((a, b) => String(a[sortBy]).localeCompare(String(b[sortBy])) * (query.sortOrder === 'desc' ? -1 : 1));
  const total = result.length;
  return { data: result.slice((query.page - 1) * query.limit, query.page * query.limit), meta: { total, page: query.page, limit: query.limit } };
};

export class EquipmentService {
  constructor(repository, requestRepository) { this.repository = repository; this.requestRepository = requestRepository; }
  async getAll(query) { return list(await this.repository.findAll(), query, [['type'], ['status']]); }
  async getById(id) { const item = await this.repository.findById(id); if (!item) throw new NotFoundError('Оборудование'); return item; }
  async create(payload) {
    const existing = (await this.repository.findAll()).find((item) => item.serialNumber === payload.serialNumber);
    if (existing) throw new ConflictError('Серийный номер уже используется');
    return this.repository.create({ id: randomUUID(), ...payload });
  }
  async update(id, payload) {
    await this.getById(id);
    if (payload.serialNumber) {
      const duplicate = (await this.repository.findAll()).find((item) => item.serialNumber === payload.serialNumber && item.id !== id);
      if (duplicate) throw new ConflictError('Серийный номер уже используется');
    }
    return this.repository.update(id, payload);
  }
  async delete(id) {
    await this.getById(id);
    const requests = await this.requestRepository.findAll();
    if (requests.some((request) => request.equipmentId === id && ['new', 'in_progress'].includes(request.status))) throw new ConflictError('Нельзя удалить оборудование с открытыми заявками');
    await this.repository.delete(id);
  }
}
