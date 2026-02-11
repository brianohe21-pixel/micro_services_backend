import { Repository } from 'typeorm';
import { Product } from '../../domain/entities/Product';
import { IProductRepository, PaginatedResult } from '../../domain/repositories/IProductRepository';
import { ProductEntity } from './entities/ProductEntity';
import { AppDataSource } from './data-source';
import { DatabaseError } from '../../domain/errors/DomainErrors';

export class ProductRepository implements IProductRepository {
  private repository: Repository<ProductEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(ProductEntity);
  }

  async create(product: Product): Promise<Product> {
    try {
      const entity = this.toEntity(product);
      const saved = await this.repository.save(entity);
      return this.toDomain(saved);
    } catch (error) {
      throw new DatabaseError(`Failed to create product: ${(error as Error).message}`);
    }
  }

  async findById(id: string): Promise<Product | null> {
    try {
      const entity = await this.repository.findOne({ where: { id } });
      return entity ? this.toDomain(entity) : null;
    } catch (error) {
      throw new DatabaseError(`Failed to find product: ${(error as Error).message}`);
    }
  }

  async update(id: string, data: Partial<Product>): Promise<Product> {
    try {
      const entity = await this.repository.findOne({ where: { id } });
      if (!entity) {
        throw new Error(`Product with id ${id} not found`);
      }

      if (data.name !== undefined) entity.name = data.name;
      if (data.description !== undefined) entity.description = data.description;
      if (data.price !== undefined) entity.price = data.price;
      entity.updatedAt = new Date();

      const updated = await this.repository.save(entity);
      return this.toDomain(updated);
    } catch (error) {
      throw new DatabaseError(`Failed to update product: ${(error as Error).message}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.repository.delete(id);
    } catch (error) {
      throw new DatabaseError(`Failed to delete product: ${(error as Error).message}`);
    }
  }

  async findAll(page: number, limit: number): Promise<PaginatedResult<Product>> {
    try {
      const skip = (page - 1) * limit;
      
      const [entities, total] = await this.repository.findAndCount({
        skip,
        take: limit,
        order: { createdAt: 'DESC' }
      });

      const products = entities.map(entity => this.toDomain(entity));
      const totalPages = Math.ceil(total / limit);

      return {
        data: products,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      throw new DatabaseError(`Failed to list products: ${(error as Error).message}`);
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const count = await this.repository.count({ where: { id } });
      return count > 0;
    } catch (error) {
      throw new DatabaseError(`Failed to check product existence: ${(error as Error).message}`);
    }
  }

  private toDomain(entity: ProductEntity): Product {
    return new Product(
      entity.id,
      entity.name,
      entity.description,
      Number(entity.price),
      entity.createdAt,
      entity.updatedAt
    );
  }

  private toEntity(product: Product): ProductEntity {
    const entity = new ProductEntity();
    entity.id = product.id;
    entity.name = product.name;
    entity.description = product.description;
    entity.price = product.price;
    entity.createdAt = product.createdAt;
    entity.updatedAt = product.updatedAt;
    return entity;
  }
}
