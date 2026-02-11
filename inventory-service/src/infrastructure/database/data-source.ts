import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { InventoryEntity } from './entities/InventoryEntity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  database: process.env.DB_NAME || 'inventory_db',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [InventoryEntity],
  migrations: ['src/infrastructure/database/migrations/*.ts'],
  subscribers: [],
});

export const initializeDatabase = async (): Promise<DataSource> => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established successfully');
    return AppDataSource;
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  }
};
