import { getWeatherForLocation } from '../services/weather-service.js';
import { equipmentPayload, requestPayload, statusPayload, validateId, validateListQuery } from '../validators/index.js';

const sendCreated = (res, path, entity) => res.status(201).location(`${path}/${entity.id}`).json({ data: entity });
export const createEquipmentController = (service) => ({
  list: async (req, res) => res.json(await service.getAll(req.validatedQuery ?? validateListQuery(req.query, ['type', 'status']))),
  create: async (req, res) => sendCreated(res, '/api/equipment', await service.create(req.validatedBody ?? equipmentPayload(req.body))),
  get: async (req, res) => res.json({ data: await service.getById(validateId(req.params.id)) }),
  update: async (req, res) => res.json({ data: await service.update(validateId(req.params.id), req.validatedBody ?? equipmentPayload(req.body, { partial: true })) }),
  remove: async (req, res) => { await service.delete(validateId(req.params.id)); res.status(204).end(); },
  requests: async (req, res, requestService) => res.json(await requestService.getByEquipmentId(validateId(req.params.id), validateListQuery(req.query, ['status', 'priority']))),
  weather: async (req, res) => { const equipment = await service.getById(validateId(req.params.id)); res.json({ data: await getWeatherForLocation(equipment.location) }); },
});
export const createRequestController = (service) => ({
  list: async (req, res) => res.json(await service.getAll(req.validatedQuery ?? validateListQuery(req.query, ['status', 'priority', 'equipmentId']))),
  create: async (req, res) => sendCreated(res, '/api/requests', await service.create(req.validatedBody ?? requestPayload(req.body))),
  get: async (req, res) => res.json({ data: await service.getById(validateId(req.params.id)) }),
  update: async (req, res) => res.json({ data: await service.update(validateId(req.params.id), req.validatedBody ?? requestPayload(req.body, { partial: true })) }),
  status: async (req, res) => res.json({ data: await service.changeStatus(validateId(req.params.id), (req.validatedBody ?? statusPayload(req.body)).status) }),
  remove: async (req, res) => { await service.delete(validateId(req.params.id)); res.status(204).end(); },
});
