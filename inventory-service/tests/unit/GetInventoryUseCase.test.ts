import { GetInventoryUseCase } from '../../src/application/use-cases/GetInventoryUseCase';
import { IInventoryRepository } from '../../src/domain/repositories/IInventoryRepository';
import { IProductValidationService } from '../../src/domain/services/IProductValidationService';
import { Inventory } from '../../src/domain/entities/Inventory';
import { ProductNotFoundError, InventoryNotFoundError } from '../../src/domain/errors/DomainErrors';

describe('GetInventoryUseCase', () => {
  let mockRepository: jest.Mocked<IInventoryRepository>;
  let mockProductService: jest.Mocked<IProductValidationService>;
  let useCase: GetInventoryUseCase;

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

    useCase = new GetInventoryUseCase(mockRepository, mockProductService);
  });

  it('should return inventory when product and inventory exist', async () => {
    const productId = 'product-123';
    const inventory = new Inventory(
      'inventory-123',
      productId,
      100,
      new Date()
    );

    mockProductService.validateProductExists.mockResolvedValue(true);
    mockRepository.findByProductId.mockResolvedValue(inventory);

    const result = await useCase.execute(productId);

    expect(mockProductService.validateProductExists).toHaveBeenCalledWith(productId);
    expect(mockRepository.findByProductId).toHaveBeenCalledWith(productId);
    expect(result).toEqual(inventory);
  });

  it('should throw ProductNotFoundError when product does not exist', async () => {
    const productId = 'non-existent-product';
    mockProductService.validateProductExists.mockResolvedValue(false);

    await expect(useCase.execute(productId))
      .rejects.toThrow(ProductNotFoundError);

    expect(mockRepository.findByProductId).not.toHaveBeenCalled();
  });

  it('should throw InventoryNotFoundError when inventory does not exist', async () => {
    const productId = 'product-123';
    mockProductService.validateProductExists.mockResolvedValue(true);
    mockRepository.findByProductId.mockResolvedValue(null);

    await expect(useCase.execute(productId))
      .rejects.toThrow(InventoryNotFoundError);
  });
});
