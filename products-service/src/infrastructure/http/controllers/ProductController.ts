import { Request, Response, NextFunction } from 'express';
import { CreateProductUseCase } from '../../../application/use-cases/CreateProductUseCase';
import { GetProductUseCase } from '../../../application/use-cases/GetProductUseCase';
import { UpdateProductUseCase } from '../../../application/use-cases/UpdateProductUseCase';
import { DeleteProductUseCase } from '../../../application/use-cases/DeleteProductUseCase';
import { ListProductsUseCase } from '../../../application/use-cases/ListProductsUseCase';
import { ProductSerializer } from '../serializers/ProductSerializer';

export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly getProductUseCase: GetProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
    private readonly listProductsUseCase: ListProductsUseCase
  ) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description, price } = req.body;
      
      const product = await this.createProductUseCase.execute({
        name,
        description,
        price
      });

      const serialized = ProductSerializer.serialize(product);
      res.status(201).json(serialized);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const product = await this.getProductUseCase.execute(id);
      
      const serialized = ProductSerializer.serialize(product);
      res.status(200).json(serialized);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, price } = req.body;
      
      const product = await this.updateProductUseCase.execute(id, {
        name,
        description,
        price
      });

      const serialized = ProductSerializer.serialize(product);
      res.status(200).json(serialized);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      await this.deleteProductUseCase.execute(id);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query['page[number]'] ? parseInt(req.query['page[number]'] as string) : undefined;
      const limit = req.query['page[size]'] ? parseInt(req.query['page[size]'] as string) : undefined;
      
      const result = await this.listProductsUseCase.execute({ page, limit });
      
      const serialized = ProductSerializer.serializeList(result);
      res.status(200).json(serialized);
    } catch (error) {
      next(error);
    }
  }
}
