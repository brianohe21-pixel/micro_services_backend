import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createProductsRouter } from './routes/products.routes';
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
    res.status(200).json({ status: 'ok', service: 'products-service' });
  });

  app.use('/', createSwaggerRouter());

  app.use('/api/v1', apiKeyAuth, createProductsRouter());

  app.use(errorHandler);

  return app;
};
