import { v4 as uuidv4 } from 'uuid';
import { Inventory } from '../../domain/entities/Inventory';
import { IInventoryRepository } from '../../domain/repositories/IInventoryRepository';
import { IProductValidationService } from '../../domain/services/IProductValidationService';
import { IInventoryEventService } from '../../domain/services/IInventoryEventService';
import { ProductNotFoundError, ValidationError } from '../../domain/errors/DomainErrors';

export interface CreateInventoryDTO {
  productId: string;
  quantity: number;
}

export class CreateInventoryUseCase {
  constructor(
    private readonly inventoryRepository: IInventoryRepository,
    private readonly productValidationService: IProductValidationService,
    private readonly eventService: IInventoryEventService
  ) {}

  async execute(dto: CreateInventoryDTO): Promise<Inventory> {
    this.validateDTO(dto);

    const productExists = await this.productValidationService.validateProductExists(dto.productId);
    if (!productExists) {
      throw new ProductNotFoundError(dto.productId);
    }

    const existingInventory = await this.inventoryRepository.findByProductId(dto.productId);
    if (existingInventory) {
      throw new ValidationError(`Inventory for product ${dto.productId} already exists`);
    }

    const inventory = new Inventory(
      uuidv4(),
      dto.productId,
      dto.quantity,
      new Date()
    );

    const created = await this.inventoryRepository.create(inventory);

    this.eventService.emitInventoryCreated(dto.productId, dto.quantity);

    return created;
  }

  private validateDTO(dto: CreateInventoryDTO): void {
    if (!dto.productId || typeof dto.productId !== 'string') {
      throw new ValidationError('Product ID is required and must be a string');
    }

    if (dto.quantity === undefined || typeof dto.quantity !== 'number' || isNaN(dto.quantity)) {
      throw new ValidationError('Quantity is required and must be a number');
    }

    if (dto.quantity < 0) {
      throw new ValidationError('Quantity cannot be negative');
    }
  }
}
