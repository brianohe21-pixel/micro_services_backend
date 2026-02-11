import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { ProductNotFoundError, ValidationError } from '../../domain/errors/DomainErrors';

export class DeleteProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(productId: string): Promise<void> {
    if (!productId || typeof productId !== 'string') {
      throw new ValidationError('Product ID is required and must be a string');
    }

    const exists = await this.productRepository.exists(productId);
    if (!exists) {
      throw new ProductNotFoundError(productId);
    }

    await this.productRepository.delete(productId);
  }
}
