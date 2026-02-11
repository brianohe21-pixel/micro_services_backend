import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createInventoryRouter } from './routes/inventory.routes';
import { createSwaggerRouter } from './routes/swagger.routes';
import { apiKeyAuth } from '../middleware/apiKeyAuth';
import { errorHandler } from '../middleware/errorHandler';
import { requestLogger } from '../middleware/requestLogger';

export const createApp = (): Application => {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: false
  }));
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  app.use(requestLogger);

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'inventory-service' });
  });

  app.use('/', createSwaggerRouter());

  app.use('/api/v1', apiKeyAuth, createInventoryRouter());

  app.use(errorHandler);

  return app;
};
