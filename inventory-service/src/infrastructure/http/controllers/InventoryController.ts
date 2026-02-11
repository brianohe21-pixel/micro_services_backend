import { Request, Response, NextFunction } from 'express';
import { GetInventoryUseCase } from '../../../application/use-cases/GetInventoryUseCase';
import { UpdateInventoryUseCase } from '../../../application/use-cases/UpdateInventoryUseCase';
import { CreateInventoryUseCase } from '../../../application/use-cases/CreateInventoryUseCase';
import { InventorySerializer } from '../serializers/InventorySerializer';

export class InventoryController {
  constructor(
    private readonly getInventoryUseCase: GetInventoryUseCase,
    private readonly updateInventoryUseCase: UpdateInventoryUseCase,
    private readonly createInventoryUseCase: CreateInventoryUseCase
  ) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId, quantity } = req.body;
      
      const inventory = await this.createInventoryUseCase.execute({
        productId,
        quantity
      });

      const serialized = InventorySerializer.serialize(inventory);
      res.status(201).json(serialized);
    } catch (error) {
      next(error);
    }
  }

  async getByProductId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.params;
      
      const inventory = await this.getInventoryUseCase.execute(productId);
      
      const serialized = InventorySerializer.serialize(inventory);
      res.status(200).json(serialized);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.params;
      const { quantity } = req.body;
      
      const inventory = await this.updateInventoryUseCase.execute(productId, {
        quantity
      });

      const serialized = InventorySerializer.serialize(inventory);
      res.status(200).json(serialized);
    } catch (error) {
      next(error);
    }
  }
}
