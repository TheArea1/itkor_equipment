import express from 'express';
import { config } from './config/index.js';
import { equipmentRepository, requestRepository } from './repositories/index.js';
import { EquipmentService } from './services/equipment-service.js';
import { RequestService } from './services/request-service.js';
import { createEquipmentController, createRequestController } from './controllers/index.js';
import { cors, createRateLimit, errorHandler, logger, notFound, requestId, securityHeaders } from './middlewares/index.js';
import { createApiRouter } from './routes/index.js';

export function createApp() {
  const app = express();
  const equipmentService = new EquipmentService(equipmentRepository, requestRepository);
  const requestService = new RequestService(requestRepository, equipmentRepository);
  const equipmentController = createEquipmentController(equipmentService);
  const requestController = createRequestController(requestService);
  app.use(logger); app.use(express.json({ limit: config.bodyLimit })); app.use(requestId); app.use(cors); app.use(securityHeaders); app.use('/api', createRateLimit());
  app.use('/api', createApiRouter(equipmentController, requestController, requestService)); app.use(notFound); app.use(errorHandler);
  return app;
}
