import request from 'supertest';
import { createApp } from '../../src/infrastructure/http/app';
import { AppDataSource } from '../../src/infrastructure/database/data-source';

describe('Products API Integration Tests', () => {
  let app: any;
  const API_KEY = process.env.API_KEY || 'test-api-key';

  beforeAll(async () => {
    process.env.API_KEY = API_KEY;
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5432';
    process.env.DB_NAME = 'products_test_db';
    process.env.DB_USER = 'postgres';
    process.env.DB_PASSWORD = 'postgres123';
    process.env.NODE_ENV = 'test';

    await AppDataSource.initialize();
    app = createApp();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  beforeEach(async () => {
    await AppDataSource.synchronize(true);
  });

  describe('POST /api/v1/products', () => {
    it('should create a product with valid data', async () => {
      const productData = {
        name: 'Test Laptop',
        description: 'A high-performance laptop',
        price: 1500
      };

      const response = await request(app)
        .post('/api/v1/products')
        .set('X-API-Key', API_KEY)
        .send(productData)
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.type).toBe('products');
      expect(response.body.data.attributes.name).toBe(productData.name);
      expect(response.body.data.attributes.price).toBe(productData.price);
    });

    it('should return 401 without API key', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Description',
        price: 100
      };

      const response = await request(app)
        .post('/api/v1/products')
        .send(productData)
        .expect(401);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].status).toBe('401');
    });

    it('should return 400 with invalid data', async () => {
      const productData = {
        name: '',
        description: 'Description',
        price: -100
      };

      const response = await request(app)
        .post('/api/v1/products')
        .set('X-API-Key', API_KEY)
        .send(productData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('should retrieve a product by ID', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 200
      };

      const createResponse = await request(app)
        .post('/api/v1/products')
        .set('X-API-Key', API_KEY)
        .send(productData);

      const productId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/v1/products/${productId}`)
        .set('X-API-Key', API_KEY)
        .expect(200);

      expect(response.body.data.id).toBe(productId);
      expect(response.body.data.attributes.name).toBe(productData.name);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .get(`/api/v1/products/${fakeId}`)
        .set('X-API-Key', API_KEY)
        .expect(404);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].status).toBe('404');
    });
  });

  describe('PATCH /api/v1/products/:id', () => {
    it('should update a product', async () => {
      const productData = {
        name: 'Original Name',
        description: 'Original Description',
        price: 100
      };

      const createResponse = await request(app)
        .post('/api/v1/products')
        .set('X-API-Key', API_KEY)
        .send(productData);

      const productId = createResponse.body.data.id;

      const updateData = {
        name: 'Updated Name',
        price: 150
      };

      const response = await request(app)
        .patch(`/api/v1/products/${productId}`)
        .set('X-API-Key', API_KEY)
        .send(updateData)
        .expect(200);

      expect(response.body.data.attributes.name).toBe(updateData.name);
      expect(response.body.data.attributes.price).toBe(updateData.price);
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    it('should delete a product', async () => {
      const productData = {
        name: 'To Delete',
        description: 'Will be deleted',
        price: 50
      };

      const createResponse = await request(app)
        .post('/api/v1/products')
        .set('X-API-Key', API_KEY)
        .send(productData);

      const productId = createResponse.body.data.id;

      await request(app)
        .delete(`/api/v1/products/${productId}`)
        .set('X-API-Key', API_KEY)
        .expect(204);

      await request(app)
        .get(`/api/v1/products/${productId}`)
        .set('X-API-Key', API_KEY)
        .expect(404);
    });
  });

  describe('GET /api/v1/products', () => {
    it('should list products with pagination', async () => {
      const products = [
        { name: 'Product 1', description: 'Desc 1', price: 100 },
        { name: 'Product 2', description: 'Desc 2', price: 200 },
        { name: 'Product 3', description: 'Desc 3', price: 300 }
      ];

      for (const product of products) {
        await request(app)
          .post('/api/v1/products')
          .set('X-API-Key', API_KEY)
          .send(product);
      }

      const response = await request(app)
        .get('/api/v1/products?page[number]=1&page[size]=2')
        .set('X-API-Key', API_KEY)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta.total).toBeGreaterThanOrEqual(3);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(2);
      expect(response.body.links).toBeDefined();
    });
  });
});
