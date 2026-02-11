import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { ProductRepository } from '../../database/ProductRepository';
import { CreateProductUseCase } from '../../../application/use-cases/CreateProductUseCase';
import { GetProductUseCase } from '../../../application/use-cases/GetProductUseCase';
import { UpdateProductUseCase } from '../../../application/use-cases/UpdateProductUseCase';
import { DeleteProductUseCase } from '../../../application/use-cases/DeleteProductUseCase';
import { ListProductsUseCase } from '../../../application/use-cases/ListProductsUseCase';

export const createProductsRouter = (): Router => {
  const router = Router();
  
  const productRepository = new ProductRepository();
  
  const createProductUseCase = new CreateProductUseCase(productRepository);
  const getProductUseCase = new GetProductUseCase(productRepository);
  const updateProductUseCase = new UpdateProductUseCase(productRepository);
  const deleteProductUseCase = new DeleteProductUseCase(productRepository);
  const listProductsUseCase = new ListProductsUseCase(productRepository);
  
  const controller = new ProductController(
    createProductUseCase,
    getProductUseCase,
    updateProductUseCase,
    deleteProductUseCase,
    listProductsUseCase
  );

  router.post('/products', (req, res, next) => controller.create(req, res, next));
  router.get('/products/:id', (req, res, next) => controller.getById(req, res, next));
  router.patch('/products/:id', (req, res, next) => controller.update(req, res, next));
  router.delete('/products/:id', (req, res, next) => controller.delete(req, res, next));
  router.get('/products', (req, res, next) => controller.list(req, res, next));

  return router;
};
