import { Inventory } from '../../domain/entities/Inventory';
import { IInventoryRepository } from '../../domain/repositories/IInventoryRepository';
import { IProductValidationService } from '../../domain/services/IProductValidationService';
import { InventoryNotFoundError, ProductNotFoundError, ValidationError } from '../../domain/errors/DomainErrors';

export class GetInventoryUseCase {
  constructor(
    private readonly inventoryRepository: IInventoryRepository,
    private readonly productValidationService: IProductValidationService
  ) {}

  async execute(productId: string): Promise<Inventory> {
    if (!productId || typeof productId !== 'string') {
      throw new ValidationError('Product ID is required and must be a string');
    }

    const productExists = await this.productValidationService.validateProductExists(productId);
    if (!productExists) {
      throw new ProductNotFoundError(productId);
    }

    const inventory = await this.inventoryRepository.findByProductId(productId);
    if (!inventory) {
      throw new InventoryNotFoundError(productId);
    }

    return inventory;
  }
}
