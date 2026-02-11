import { UpdateInventoryUseCase } from '../../src/application/use-cases/UpdateInventoryUseCase';
import { IInventoryRepository } from '../../src/domain/repositories/IInventoryRepository';
import { IProductValidationService } from '../../src/domain/services/IProductValidationService';
import { IInventoryEventService } from '../../src/domain/services/IInventoryEventService';
import { Inventory } from '../../src/domain/entities/Inventory';
import { ProductNotFoundError, InventoryNotFoundError, ValidationError } from '../../src/domain/errors/DomainErrors';

describe('UpdateInventoryUseCase', () => {
  let mockRepository: jest.Mocked<IInventoryRepository>;
  let mockProductService: jest.Mocked<IProductValidationService>;
  let mockEventService: jest.Mocked<IInventoryEventService>;
  let useCase: UpdateInventoryUseCase;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findByProductId: jest.fn(),
      update: jest.fn(),
      exists: jest.fn()
    };

    mockProductService = {
      validateProductExists: jest.fn(),
      getProductDetails: jest.fn()
    };

    mockEventService = {
      emitInventoryUpdated: jest.fn(),
      emitInventoryCreated: jest.fn()
    };

    useCase = new UpdateInventoryUseCase(
      mockRepository,
      mockProductService,
      mockEventService
    );
  });

  it('should update inventory after validating product exists', async () => {
    const productId = 'product-123';
    const existingInventory = new Inventory(
      'inventory-123',
      productId,
      100,
      new Date()
    );

    const updatedInventory = new Inventory(
      'inventory-123',
      productId,
      95,
      new Date()
    );

    mockProductService.validateProductExists.mockResolvedValue(true);
    mockRepository.findByProductId.mockResolvedValue(existingInventory);
    mockRepository.update.mockResolvedValue(updatedInventory);

    const result = await useCase.execute(productId, { quantity: 95 });

    expect(mockProductService.validateProductExists).toHaveBeenCalledWith(productId);
    expect(mockRepository.findByProductId).toHaveBeenCalledWith(productId);
    expect(mockRepository.update).toHaveBeenCalledWith(productId, 95);
    expect(mockEventService.emitInventoryUpdated).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'inventory.updated',
        productId,
        previousQuantity: 100,
        newQuantity: 95
      })
    );
    expect(result).toEqual(updatedInventory);
  });

  it('should throw ProductNotFoundError when product does not exist', async () => {
    const productId = 'non-existent-product';
    mockProductService.validateProductExists.mockResolvedValue(false);

    await expect(useCase.execute(productId, { quantity: 50 }))
      .rejects.toThrow(ProductNotFoundError);

    expect(mockRepository.findByProductId).not.toHaveBeenCalled();
    expect(mockEventService.emitInventoryUpdated).not.toHaveBeenCalled();
  });

  it('should throw InventoryNotFoundError when inventory does not exist', async () => {
    const productId = 'product-123';
    mockProductService.validateProductExists.mockResolvedValue(true);
    mockRepository.findByProductId.mockResolvedValue(null);

    await expect(useCase.execute(productId, { quantity: 50 }))
      .rejects.toThrow(InventoryNotFoundError);

    expect(mockRepository.update).not.toHaveBeenCalled();
    expect(mockEventService.emitInventoryUpdated).not.toHaveBeenCalled();
  });

  it('should throw ValidationError when quantity is negative', async () => {
    const productId = 'product-123';

    await expect(useCase.execute(productId, { quantity: -10 }))
      .rejects.toThrow(ValidationError);

    expect(mockProductService.validateProductExists).not.toHaveBeenCalled();
  });

  it('should throw ValidationError when quantity is not a number', async () => {
    const productId = 'product-123';

    await expect(useCase.execute(productId, { quantity: NaN }))
      .rejects.toThrow(ValidationError);

    expect(mockProductService.validateProductExists).not.toHaveBeenCalled();
  });
});
