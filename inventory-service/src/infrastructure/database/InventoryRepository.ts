import { Repository } from 'typeorm';
import { Inventory } from '../../domain/entities/Inventory';
import { IInventoryRepository } from '../../domain/repositories/IInventoryRepository';
import { InventoryEntity } from './entities/InventoryEntity';
import { AppDataSource } from './data-source';
import { DatabaseError } from '../../domain/errors/DomainErrors';

export class InventoryRepository implements IInventoryRepository {
  private repository: Repository<InventoryEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(InventoryEntity);
  }

  async create(inventory: Inventory): Promise<Inventory> {
    try {
      const entity = this.toEntity(inventory);
      const saved = await this.repository.save(entity);
      return this.toDomain(saved);
    } catch (error) {
      throw new DatabaseError(`Failed to create inventory: ${(error as Error).message}`);
    }
  }

  async findByProductId(productId: string): Promise<Inventory | null> {
    try {
      const entity = await this.repository.findOne({ where: { productId } });
      return entity ? this.toDomain(entity) : null;
    } catch (error) {
      throw new DatabaseError(`Failed to find inventory: ${(error as Error).message}`);
    }
  }

  async update(productId: string, quantity: number): Promise<Inventory> {
    try {
      const entity = await this.repository.findOne({ where: { productId } });
      if (!entity) {
        throw new Error(`Inventory for product ${productId} not found`);
      }

      entity.quantity = quantity;
      entity.updatedAt = new Date();

      const updated = await this.repository.save(entity);
      return this.toDomain(updated);
    } catch (error) {
      throw new DatabaseError(`Failed to update inventory: ${(error as Error).message}`);
    }
  }

  async exists(productId: string): Promise<boolean> {
    try {
      const count = await this.repository.count({ where: { productId } });
      return count > 0;
    } catch (error) {
      throw new DatabaseError(`Failed to check inventory existence: ${(error as Error).message}`);
    }
  }

  private toDomain(entity: InventoryEntity): Inventory {
    return new Inventory(
      entity.id,
      entity.productId,
      entity.quantity,
      entity.updatedAt
    );
  }

  private toEntity(inventory: Inventory): InventoryEntity {
    const entity = new InventoryEntity();
    entity.id = inventory.id;
    entity.productId = inventory.productId;
    entity.quantity = inventory.quantity;
    entity.updatedAt = inventory.updatedAt;
    return entity;
  }
}
