import { Product } from '../entities/Product';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IProductRepository {
  create(product: Product): Promise<Product>;
  findById(id: string): Promise<Product | null>;
  update(id: string, data: Partial<Product>): Promise<Product>;
  delete(id: string): Promise<void>;
  findAll(page: number, limit: number): Promise<PaginatedResult<Product>>;
  exists(id: string): Promise<boolean>;
}
