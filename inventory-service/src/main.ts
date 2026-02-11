import 'reflect-metadata';
import dotenv from 'dotenv';
import { createApp } from './infrastructure/http/app';
import { initializeDatabase } from './infrastructure/database/data-source';
import { logger } from './infrastructure/logging/logger';

dotenv.config();

const PORT = process.env.PORT || 3002;

const startServer = async () => {
  try {
    await initializeDatabase();
    logger.info('Database initialized successfully');

    const app = createApp();

    app.listen(PORT, () => {
      logger.info(`Inventory service is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Products service URL: ${process.env.PRODUCTS_SERVICE_URL}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
};

startServer();
