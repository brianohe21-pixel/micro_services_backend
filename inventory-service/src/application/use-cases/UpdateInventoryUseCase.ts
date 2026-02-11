import { Inventory } from '../../domain/entities/Inventory';
import { IInventoryRepository } from '../../domain/repositories/IInventoryRepository';
import { IProductValidationService } from '../../domain/services/IProductValidationService';
import { IInventoryEventService } from '../../domain/services/IInventoryEventService';
import { 
  InventoryNotFoundError, 
  ProductNotFoundError, 
  ValidationError,
  InsufficientInventoryError 
} from '../../domain/errors/DomainErrors';

export interface UpdateInventoryDTO {
  quantity: number;
}

export class UpdateInventoryUseCase {
  constructor(
    private readonly inventoryRepository: IInventoryRepository,
    private readonly productValidationService: IProductValidationService,
    private readonly eventService: IInventoryEventService
  ) {}

  async execute(productId: string, dto: UpdateInventoryDTO): Promise<Inventory> {
    if (!productId || typeof productId !== 'string') {
      throw new ValidationError('Product ID is required and must be a string');
    }

    this.validateDTO(dto);

    const productExists = await this.productValidationService.validateProductExists(productId);
    if (!productExists) {
      throw new ProductNotFoundError(productId);
    }

    const existingInventory = await this.inventoryRepository.findByProductId(productId);
    if (!existingInventory) {
      throw new InventoryNotFoundError(productId);
    }

    if (dto.quantity < 0) {
      throw new ValidationError('Quantity cannot be negative');
    }

    const previousQuantity = existingInventory.quantity;
    
    const updatedInventory = await this.inventoryRepository.update(productId, dto.quantity);

    this.eventService.emitInventoryUpdated({
      event: 'inventory.updated',
      productId,
      previousQuantity,
      newQuantity: dto.quantity,
      timestamp: new Date()
    });

    return updatedInventory;
  }

  private validateDTO(dto: UpdateInventoryDTO): void {
    if (dto.quantity === undefined || typeof dto.quantity !== 'number' || isNaN(dto.quantity)) {
      throw new ValidationError('Quantity is required and must be a number');
    }
  }
}
