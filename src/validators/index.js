import { ValidationError } from '../errors/index.js';

const equipmentTypes = new Set(['turbine', 'inverter', 'sensor', 'substation']);
const equipmentStatuses = new Set(['operational', 'maintenance', 'fault', 'decommissioned']);
const priorities = new Set(['low', 'medium', 'high', 'critical']);
const requestStatuses = new Set(['new', 'in_progress', 'done', 'rejected']);
const isIsoDate = (value) => typeof value === 'string' && !Number.isNaN(Date.parse(value));
const error = (field, message) => ({ field, message });

export function validateId(value, field = 'id') {
  if (typeof value !== 'string' || !value.trim()) throw new ValidationError([error(field, 'Обязательная строка')]);
  return value;
}
export function validateListQuery(query, allowedFilters = []) {
  const errors = [];
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  if (!Number.isInteger(page) || page < 1) errors.push(error('page', 'Должно быть положительным целым числом'));
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) errors.push(error('limit', 'Должно быть целым числом от 1 до 100'));
  if (query.sortOrder && !['asc', 'desc'].includes(query.sortOrder)) errors.push(error('sortOrder', 'Допустимы asc или desc'));
  if (query.type && !equipmentTypes.has(query.type)) errors.push(error('type', 'Недопустимый тип'));
  if (query.priority && !priorities.has(query.priority)) errors.push(error('priority', 'Недопустимый приоритет'));
  if (query.status && !(allowedFilters.includes('type') ? equipmentStatuses : requestStatuses).has(query.status)) errors.push(error('status', 'Недопустимый статус'));
  if (query.equipmentId !== undefined && (typeof query.equipmentId !== 'string' || !query.equipmentId.trim())) errors.push(error('equipmentId', 'Обязательная строка'));
  for (const key of ['fromDate', 'toDate']) if (query[key] && !isIsoDate(query[key])) errors.push(error(key, 'Ожидается ISO-дата'));
  if (errors.length) throw new ValidationError(errors);
  const result = { page, limit, sortBy: query.sortBy, sortOrder: query.sortOrder ?? 'asc' };
  for (const key of allowedFilters) if (query[key] !== undefined) result[key] = query[key];
  if (query.fromDate) result.fromDate = query.fromDate;
  if (query.toDate) result.toDate = query.toDate;
  return result;
}
export function equipmentPayload(body, { partial = false } = {}) {
  const allowed = ['name', 'type', 'serialNumber', 'location', 'status', 'installedAt'];
  const value = Object.fromEntries(Object.entries(body ?? {}).filter(([key]) => allowed.includes(key)));
  const errors = [];
  if (!partial || 'name' in value) if (typeof value.name !== 'string' || value.name.trim().length < 3 || value.name.trim().length > 100) errors.push(error('name', 'От 3 до 100 символов'));
  if (!partial || 'type' in value) if (!equipmentTypes.has(value.type)) errors.push(error('type', 'Недопустимый тип'));
  if (!partial || 'serialNumber' in value) if (typeof value.serialNumber !== 'string' || !value.serialNumber.trim()) errors.push(error('serialNumber', 'Обязательная непустая строка'));
  if (!partial || 'location' in value) {
    if (!value.location || !Number.isFinite(value.location.lat) || !Number.isFinite(value.location.lon) || value.location.lat < -90 || value.location.lat > 90 || value.location.lon < -180 || value.location.lon > 180) errors.push(error('location', 'lat и lon должны быть координатами'));
  }
  if ('status' in value && !equipmentStatuses.has(value.status)) errors.push(error('status', 'Недопустимый статус'));
  if (!partial || 'installedAt' in value) if (!isIsoDate(value.installedAt) || Date.parse(value.installedAt) > Date.now()) errors.push(error('installedAt', 'ISO-дата не может быть в будущем'));
  if (partial && !Object.keys(value).length) errors.push(error('body', 'Нет обновляемых полей'));
  if (errors.length) throw new ValidationError(errors);
  if (value.name) value.name = value.name.trim();
  if (value.serialNumber) value.serialNumber = value.serialNumber.trim();
  return value;
}
export function requestPayload(body, { partial = false } = {}) {
  const allowed = partial ? ['title', 'description', 'priority', 'plannedAt'] : ['equipmentId', 'title', 'description', 'priority', 'plannedAt'];
  const value = Object.fromEntries(Object.entries(body ?? {}).filter(([key]) => allowed.includes(key)));
  const errors = [];
  if (!partial && (typeof value.equipmentId !== 'string' || !value.equipmentId.trim())) errors.push(error('equipmentId', 'Обязательная строка'));
  if (!partial || 'title' in value) if (typeof value.title !== 'string' || value.title.trim().length < 5 || value.title.trim().length > 120) errors.push(error('title', 'От 5 до 120 символов'));
  if ('description' in value && (typeof value.description !== 'string' || value.description.length > 2000)) errors.push(error('description', 'Строка до 2000 символов'));
  if (!partial || 'priority' in value) if (!priorities.has(value.priority)) errors.push(error('priority', 'Недопустимый приоритет'));
  if ('plannedAt' in value && (!isIsoDate(value.plannedAt))) errors.push(error('plannedAt', 'Ожидается ISO-дата-время'));
  if (partial && !Object.keys(value).length) errors.push(error('body', 'Нет обновляемых полей'));
  if (errors.length) throw new ValidationError(errors);
  if (value.title) value.title = value.title.trim();
  return value;
}
export function statusPayload(body) {
  const status = body?.status;
  if (!requestStatuses.has(status)) throw new ValidationError([error('status', 'Недопустимый статус')]);
  return { status };
}
