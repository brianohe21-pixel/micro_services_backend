import { Product } from '../../domain/entities/Product';
import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { ProductNotFoundError, ValidationError } from '../../domain/errors/DomainErrors';

export class GetProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(productId: string): Promise<Product> {
    if (!productId || typeof productId !== 'string') {
      throw new ValidationError('Product ID is required and must be a string');
    }

    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new ProductNotFoundError(productId);
    }

    return product;
  }
}
