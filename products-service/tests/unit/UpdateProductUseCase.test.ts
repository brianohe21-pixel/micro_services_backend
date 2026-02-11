import { UpdateProductUseCase } from '../../src/application/use-cases/UpdateProductUseCase';
import { IProductRepository } from '../../src/domain/repositories/IProductRepository';
import { Product } from '../../src/domain/entities/Product';
import { ProductNotFoundError, ValidationError } from '../../src/domain/errors/DomainErrors';

describe('UpdateProductUseCase', () => {
  let mockRepository: jest.Mocked<IProductRepository>;
  let useCase: UpdateProductUseCase;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      exists: jest.fn()
    };
    useCase = new UpdateProductUseCase(mockRepository);
  });

  it('should update a product with valid data', async () => {
    const productId = 'test-id';
    const existingProduct = new Product(
      productId,
      'Old Name',
      'Old Description',
      100,
      new Date(),
      new Date()
    );

    const updateDto = {
      name: 'New Name',
      price: 150
    };

    const updatedProduct = new Product(
      productId,
      'New Name',
      'Old Description',
      150,
      existingProduct.createdAt,
      new Date()
    );

    mockRepository.findById.mockResolvedValue(existingProduct);
    mockRepository.update.mockResolvedValue(updatedProduct);

    const result = await useCase.execute(productId, updateDto);

    expect(mockRepository.findById).toHaveBeenCalledWith(productId);
    expect(mockRepository.update).toHaveBeenCalledWith(
      productId,
      expect.objectContaining({
        name: 'New Name',
        price: 150
      })
    );
    expect(result).toEqual(updatedProduct);
  });

  it('should throw ProductNotFoundError when product does not exist', async () => {
    const productId = 'non-existent-id';
    mockRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(productId, { name: 'New Name' }))
      .rejects.toThrow(ProductNotFoundError);
    
    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it('should throw ValidationError when no fields provided', async () => {
    const productId = 'test-id';

    await expect(useCase.execute(productId, {}))
      .rejects.toThrow(ValidationError);
    
    expect(mockRepository.findById).not.toHaveBeenCalled();
  });

  it('should throw ValidationError when price is negative', async () => {
    const productId = 'test-id';
    const existingProduct = new Product(
      productId,
      'Name',
      'Description',
      100,
      new Date(),
      new Date()
    );

    mockRepository.findById.mockResolvedValue(existingProduct);

    await expect(useCase.execute(productId, { price: -10 }))
      .rejects.toThrow(ValidationError);
  });
});
