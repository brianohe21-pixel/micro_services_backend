import { IInventoryEventService, InventoryEvent } from '../../domain/services/IInventoryEventService';
import { logger } from '../logging/logger';

export class InventoryEventLogger implements IInventoryEventService {
  emitInventoryUpdated(event: InventoryEvent): void {
    logger.info('Inventory Updated Event', {
      event: event.event,
      productId: event.productId,
      previousQuantity: event.previousQuantity,
      newQuantity: event.newQuantity,
      delta: event.newQuantity - event.previousQuantity,
      timestamp: event.timestamp.toISOString()
    });
  }

  emitInventoryCreated(productId: string, quantity: number): void {
    logger.info('Inventory Created Event', {
      event: 'inventory.created',
      productId,
      initialQuantity: quantity,
      timestamp: new Date().toISOString()
    });
  }
}
