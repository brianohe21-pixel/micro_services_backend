import { Router } from 'express';
import { InventoryController } from '../controllers/InventoryController';
import { InventoryRepository } from '../../database/InventoryRepository';
import { ProductsServiceClient } from '../ProductsServiceClient';
import { InventoryEventLogger } from '../../events/InventoryEventLogger';
import { GetInventoryUseCase } from '../../../application/use-cases/GetInventoryUseCase';
import { UpdateInventoryUseCase } from '../../../application/use-cases/UpdateInventoryUseCase';
import { CreateInventoryUseCase } from '../../../application/use-cases/CreateInventoryUseCase';

export const createInventoryRouter = (): Router => {
  const router = Router();
  
  const inventoryRepository = new InventoryRepository();
  const productsServiceClient = new ProductsServiceClient();
  const eventLogger = new InventoryEventLogger();
  
  const getInventoryUseCase = new GetInventoryUseCase(
    inventoryRepository,
    productsServiceClient
  );
  
  const updateInventoryUseCase = new UpdateInventoryUseCase(
    inventoryRepository,
    productsServiceClient,
    eventLogger
  );

  const createInventoryUseCase = new CreateInventoryUseCase(
    inventoryRepository,
    productsServiceClient,
    eventLogger
  );
  
  const controller = new InventoryController(
    getInventoryUseCase,
    updateInventoryUseCase,
    createInventoryUseCase
  );

  router.post('/inventory', (req, res, next) => controller.create(req, res, next));
  router.get('/inventory/:productId', (req, res, next) => controller.getByProductId(req, res, next));
  router.patch('/inventory/:productId', (req, res, next) => controller.update(req, res, next));

  return router;
};
