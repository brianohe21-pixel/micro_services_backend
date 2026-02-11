import request from 'supertest';
import nock from 'nock';
import { createApp } from '../../src/infrastructure/http/app';
import { AppDataSource } from '../../src/infrastructure/database/data-source';

describe('Inventory API Integration Tests', () => {
  let app: any;
  const API_KEY = process.env.API_KEY || 'test-api-key';
  const PRODUCTS_SERVICE_URL = process.env.PRODUCTS_SERVICE_URL || 'http://products-service:3001';

  beforeAll(async () => {
    process.env.API_KEY = API_KEY;
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5432';
    process.env.DB_NAME = 'inventory_test_db';
    process.env.DB_USER = 'postgres';
    process.env.DB_PASSWORD = 'postgres123';
    process.env.NODE_ENV = 'test';
    process.env.PRODUCTS_SERVICE_URL = PRODUCTS_SERVICE_URL;

    await AppDataSource.initialize();
    app = createApp();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
    nock.cleanAll();
  });

  beforeEach(async () => {
    await AppDataSource.synchronize(true);
    nock.cleanAll();
  });

  describe('POST /api/v1/inventory', () => {
    it('should create inventory for existing product', async () => {
      const productId = '123e4567-e89b-12d3-a456-426614174000';

      nock(PRODUCTS_SERVICE_URL)
        .get(`/api/v1/products/${productId}`)
        .reply(200, {
          data: {
            type: 'products',
            id: productId,
            attributes: {
              name: 'Test Product',
              description: 'Test',
              price: 100
            }
          }
        });

      const inventoryData = {
        productId,
        quantity: 50
      };

      const response = await request(app)
        .post('/api/v1/inventory')
        .set('X-API-Key', API_KEY)
        .send(inventoryData)
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.type).toBe('inventory');
      expect(response.body.data.attributes.productId).toBe(productId);
      expect(response.body.data.attributes.quantity).toBe(50);
    });

    it('should return 404 when product does not exist', async () => {
      const productId = '123e4567-e89b-12d3-a456-426614174000';

      nock(PRODUCTS_SERVICE_URL)
        .get(`/api/v1/products/${productId}`)
        .reply(404, {
          errors: [{
            status: '404',
            title: 'Not Found',
            detail: 'Product not found'
          }]
        });

      const inventoryData = {
        productId,
        quantity: 50
      };

      const response = await request(app)
        .post('/api/v1/inventory')
        .set('X-API-Key', API_KEY)
        .send(inventoryData)
        .expect(404);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/v1/inventory/:productId', () => {
    it('should fetch inventory for existing product', async () => {
      const productId = '123e4567-e89b-12d3-a456-426614174000';

      nock(PRODUCTS_SERVICE_URL)
        .get(`/api/v1/products/${productId}`)
        .times(2)
        .reply(200, {
          data: {
            type: 'products',
            id: productId,
            attributes: { name: 'Test', description: 'Test', price: 100 }
          }
        });

      await request(app)
        .post('/api/v1/inventory')
        .set('X-API-Key', API_KEY)
        .send({ productId, quantity: 100 });

      const response = await request(app)
        .get(`/api/v1/inventory/${productId}`)
        .set('X-API-Key', API_KEY)
        .expect(200);

      expect(response.body.data.attributes.productId).toBe(productId);
      expect(response.body.data.attributes.quantity).toBe(100);
    });

    it('should return 404 when product does not exist in products service', async () => {
      const productId = '999e4567-e89b-12d3-a456-426614174999';

      nock(PRODUCTS_SERVICE_URL)
        .get(`/api/v1/products/${productId}`)
        .reply(404);

      const response = await request(app)
        .get(`/api/v1/inventory/${productId}`)
        .set('X-API-Key', API_KEY)
        .expect(404);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 503 when products service is unavailable', async () => {
      const productId = '123e4567-e89b-12d3-a456-426614174000';

      nock(PRODUCTS_SERVICE_URL)
        .get(`/api/v1/products/${productId}`)
        .replyWithError({ code: 'ECONNREFUSED' });

      const response = await request(app)
        .get(`/api/v1/inventory/${productId}`)
        .set('X-API-Key', API_KEY)
        .expect(503);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].status).toBe('503');
    });

    it('should return 504 when products service times out', async () => {
      const productId = '123e4567-e89b-12d3-a456-426614174000';

      nock(PRODUCTS_SERVICE_URL)
        .get(`/api/v1/products/${productId}`)
        .delayConnection(6000)
        .reply(200);

      const response = await request(app)
        .get(`/api/v1/inventory/${productId}`)
        .set('X-API-Key', API_KEY)
        .expect(504);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].status).toBe('504');
    });
  });

  describe('PATCH /api/v1/inventory/:productId', () => {
    it('should update inventory quantity', async () => {
      const productId = '123e4567-e89b-12d3-a456-426614174000';

      nock(PRODUCTS_SERVICE_URL)
        .get(`/api/v1/products/${productId}`)
        .times(3)
        .reply(200, {
          data: {
            type: 'products',
            id: productId,
            attributes: { name: 'Test', description: 'Test', price: 100 }
          }
        });

      await request(app)
        .post('/api/v1/inventory')
        .set('X-API-Key', API_KEY)
        .send({ productId, quantity: 100 });

      const response = await request(app)
        .patch(`/api/v1/inventory/${productId}`)
        .set('X-API-Key', API_KEY)
        .send({ quantity: 95 })
        .expect(200);

      expect(response.body.data.attributes.quantity).toBe(95);
    });

    it('should return 400 when quantity is negative', async () => {
      const productId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .patch(`/api/v1/inventory/${productId}`)
        .set('X-API-Key', API_KEY)
        .send({ quantity: -10 })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Service Communication with Retries', () => {
    it('should retry on 500 errors from products service', async () => {
      const productId = '123e4567-e89b-12d3-a456-426614174000';

      nock(PRODUCTS_SERVICE_URL)
        .get(`/api/v1/products/${productId}`)
        .reply(500)
        .get(`/api/v1/products/${productId}`)
        .reply(500)
        .get(`/api/v1/products/${productId}`)
        .reply(200, {
          data: {
            type: 'products',
            id: productId,
            attributes: { name: 'Test', description: 'Test', price: 100 }
          }
        });

      nock(PRODUCTS_SERVICE_URL)
        .get(`/api/v1/products/${productId}`)
        .reply(200, {
          data: {
            type: 'products',
            id: productId,
            attributes: { name: 'Test', description: 'Test', price: 100 }
          }
        });

      await request(app)
        .post('/api/v1/inventory')
        .set('X-API-Key', API_KEY)
        .send({ productId, quantity: 50 })
        .expect(201);
    });
  });
});
