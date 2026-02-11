import { Product } from '../../domain/entities/Product';
import { IProductRepository, PaginatedResult } from '../../domain/repositories/IProductRepository';
import { ValidationError } from '../../domain/errors/DomainErrors';

export interface ListProductsQuery {
  page?: number;
  limit?: number;
}

export class ListProductsUseCase {
  private readonly DEFAULT_PAGE = 1;
  private readonly DEFAULT_LIMIT = 10;
  private readonly MAX_LIMIT = 100;

  constructor(private readonly productRepository: IProductRepository) {}

  async execute(query: ListProductsQuery): Promise<PaginatedResult<Product>> {
    const page = this.validatePage(query.page);
    const limit = this.validateLimit(query.limit);

    return await this.productRepository.findAll(page, limit);
  }

  private validatePage(page?: number): number {
    if (page === undefined) {
      return this.DEFAULT_PAGE;
    }

    if (typeof page !== 'number' || isNaN(page)) {
      throw new ValidationError('Page must be a number');
    }

    if (page < 1) {
      throw new ValidationError('Page must be greater than 0');
    }

    return Math.floor(page);
  }

  private validateLimit(limit?: number): number {
    if (limit === undefined) {
      return this.DEFAULT_LIMIT;
    }

    if (typeof limit !== 'number' || isNaN(limit)) {
      throw new ValidationError('Limit must be a number');
    }

    if (limit < 1) {
      throw new ValidationError('Limit must be greater than 0');
    }

    if (limit > this.MAX_LIMIT) {
      throw new ValidationError(`Limit cannot exceed ${this.MAX_LIMIT}`);
    }

    return Math.floor(limit);
  }
}
