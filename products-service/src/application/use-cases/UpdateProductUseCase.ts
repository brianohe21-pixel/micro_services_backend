import { Product } from '../../domain/entities/Product';
import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { ProductNotFoundError, ValidationError } from '../../domain/errors/DomainErrors';

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  price?: number;
}

export class UpdateProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(productId: string, dto: UpdateProductDTO): Promise<Product> {
    if (!productId || typeof productId !== 'string') {
      throw new ValidationError('Product ID is required and must be a string');
    }

    this.validateDTO(dto);

    const existingProduct = await this.productRepository.findById(productId);
    if (!existingProduct) {
      throw new ProductNotFoundError(productId);
    }

    const updateData: Partial<Product> = {};
    
    if (dto.name !== undefined) {
      updateData.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      updateData.description = dto.description.trim();
    }
    if (dto.price !== undefined) {
      updateData.price = dto.price;
    }

    return await this.productRepository.update(productId, updateData);
  }

  private validateDTO(dto: UpdateProductDTO): void {
    if (Object.keys(dto).length === 0) {
      throw new ValidationError('At least one field must be provided for update');
    }

    if (dto.name !== undefined && (typeof dto.name !== 'string' || dto.name.trim().length === 0)) {
      throw new ValidationError('Name must be a non-empty string');
    }

    if (dto.description !== undefined && typeof dto.description !== 'string') {
      throw new ValidationError('Description must be a string');
    }

    if (dto.price !== undefined) {
      if (typeof dto.price !== 'number' || isNaN(dto.price)) {
        throw new ValidationError('Price must be a number');
      }
      if (dto.price < 0) {
        throw new ValidationError('Price cannot be negative');
      }
    }
  }
}
