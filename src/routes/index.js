import { Router } from 'express';
import { asyncHandler, validate } from '../middlewares/index.js';
import { equipmentPayload, requestPayload, statusPayload, validateId, validateListQuery } from '../validators/index.js';

export function createApiRouter(equipmentController, requestController, requestService) {
  const router = Router();
  router.get('/health', (_req, res) => res.json({ data: { status: 'ok' } }));
  router.get('/equipment', validate((req) => { req.validatedQuery = validateListQuery(req.query, ['type', 'status']); }), asyncHandler(equipmentController.list));
  router.post('/equipment', validate((req) => { req.validatedBody = equipmentPayload(req.body); }), asyncHandler(equipmentController.create));
  router.get('/equipment/:id', validate((req) => validateId(req.params.id)), asyncHandler(equipmentController.get));
  router.patch('/equipment/:id', validate((req) => { validateId(req.params.id); req.validatedBody = equipmentPayload(req.body, { partial: true }); }), asyncHandler(equipmentController.update));
  router.delete('/equipment/:id', validate((req) => validateId(req.params.id)), asyncHandler(equipmentController.remove));
  router.get('/equipment/:id/requests', validate((req) => validateId(req.params.id)), asyncHandler((req, res) => equipmentController.requests(req, res, requestService)));
  router.get('/equipment/:id/weather', validate((req) => validateId(req.params.id)), asyncHandler(equipmentController.weather));
  router.get('/requests', validate((req) => { req.validatedQuery = validateListQuery(req.query, ['status', 'priority', 'equipmentId']); }), asyncHandler(requestController.list));
  router.post('/requests', validate((req) => { req.validatedBody = requestPayload(req.body); }), asyncHandler(requestController.create));
  router.get('/requests/:id', validate((req) => validateId(req.params.id)), asyncHandler(requestController.get));
  router.patch('/requests/:id', validate((req) => { validateId(req.params.id); req.validatedBody = requestPayload(req.body, { partial: true }); }), asyncHandler(requestController.update));
  router.patch('/requests/:id/status', validate((req) => { validateId(req.params.id); req.validatedBody = statusPayload(req.body); }), asyncHandler(requestController.status));
  router.delete('/requests/:id', validate((req) => validateId(req.params.id)), asyncHandler(requestController.remove));
  return router;
}
