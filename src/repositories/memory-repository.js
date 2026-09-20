export class MemoryRepository {
  constructor() { this.items = new Map(); }
  async findAll() { return [...this.items.values()]; }
  async findById(id) { return this.items.get(id) ?? null; }
  async create(entity) { this.items.set(entity.id, entity); return entity; }
  async update(id, changes) {
    const current = await this.findById(id);
    if (!current) return null;
    const updated = { ...current, ...changes };
    this.items.set(id, updated);
    return updated;
  }
  async delete(id) { return this.items.delete(id); }
}
