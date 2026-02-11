import { Serializer } from 'jsonapi-serializer';
import { Inventory } from '../../../domain/entities/Inventory';

const inventorySerializer = new Serializer('inventory', {
  attributes: ['productId', 'quantity', 'updatedAt'],
  keyForAttribute: 'camelCase',
  pluralizeType: false
});

export class InventorySerializer {
  static serialize(inventory: Inventory) {
    return inventorySerializer.serialize(inventory.toJSON());
  }
}
