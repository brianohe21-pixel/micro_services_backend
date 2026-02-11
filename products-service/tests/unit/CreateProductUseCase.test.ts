import { CreateProductUseCase } from '../../src/application/use-cases/CreateProductUseCase';
import { IProductRepository } from '../../src/domain/repositories/IProductRepository';
import { Product } from '../../src/domain/entities/Product';
import { ValidationError } from '../../src/domain/errors/DomainErrors';

describe('CreateProductUseCase', () => {
  let mockRepository: jest.Mocked<IProductRepository>;
  let useCase: CreateProductUseCase;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      exists: jest.fn()
    };
    useCase = new CreateProductUseCase(mockRepository);
  });

  it('should create a product with valid data', async () => {
    const dto = {
      name: 'Test Product',
      description: 'Test Description',
      price: 100
    };

    const mockProduct = new Product(
      'test-id',
      dto.name,
      dto.description,
      dto.price,
      new Date(),
      new Date()
    );

    mockRepository.create.mockResolvedValue(mockProduct);

    const result = await useCase.execute(dto);

    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: dto.name,
        description: dto.description,
        price: dto.price
      })
    );
    expect(result).toEqual(mockProduct);
  });

  it('should throw ValidationError when name is missing', async () => {
    const dto = {
      name: '',
      description: 'Test Description',
      price: 100
    };

    await expect(useCase.execute(dto)).rejects.toThrow(ValidationError);
    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  it('should throw ValidationError when price is negative', async () => {
    const dto = {
      name: 'Test Product',
      description: 'Test Description',
      price: -10
    };

    await expect(useCase.execute(dto)).rejects.toThrow(ValidationError);
    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  it('should throw ValidationError when price is not a number', async () => {
    const dto = {
      name: 'Test Product',
      description: 'Test Description',
      price: NaN
    };

    await expect(useCase.execute(dto)).rejects.toThrow(ValidationError);
    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  it('should trim whitespace from name and description', async () => {
    const dto = {
      name: '  Test Product  ',
      description: '  Test Description  ',
      price: 100
    };

    const mockProduct = new Product(
      'test-id',
      'Test Product',
      'Test Description',
      100,
      new Date(),
      new Date()
    );

    mockRepository.create.mockResolvedValue(mockProduct);

    await useCase.execute(dto);

    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Product',
        description: 'Test Description'
      })
    );
  });
});
