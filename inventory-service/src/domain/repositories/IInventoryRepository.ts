import { Inventory } from '../entities/Inventory';

export interface IInventoryRepository {
  create(inventory: Inventory): Promise<Inventory>;
  findByProductId(productId: string): Promise<Inventory | null>;
  update(productId: string, quantity: number): Promise<Inventory>;
  exists(productId: string): Promise<boolean>;
}
