import { v4 as uuidv4 } from 'uuid';
import { Product } from '../../domain/entities/Product';
import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { ValidationError } from '../../domain/errors/DomainErrors';

export interface CreateProductDTO {
  name: string;
  description: string;
  price: number;
}

export class CreateProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(dto: CreateProductDTO): Promise<Product> {
    this.validateDTO(dto);

    const product = new Product(
      uuidv4(),
      dto.name.trim(),
      dto.description.trim(),
      dto.price,
      new Date(),
      new Date()
    );

    return await this.productRepository.create(product);
  }

  private validateDTO(dto: CreateProductDTO): void {
    if (!dto.name || typeof dto.name !== 'string') {
      throw new ValidationError('Name is required and must be a string');
    }

    if (dto.description === undefined || typeof dto.description !== 'string') {
      throw new ValidationError('Description is required and must be a string');
    }

    if (typeof dto.price !== 'number' || isNaN(dto.price)) {
      throw new ValidationError('Price is required and must be a number');
    }

    if (dto.price < 0) {
      throw new ValidationError('Price cannot be negative');
    }
  }
}
