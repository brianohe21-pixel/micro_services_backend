export interface InventoryEvent {
  event: string;
  productId: string;
  previousQuantity: number;
  newQuantity: number;
  timestamp: Date;
}

export interface IInventoryEventService {
  emitInventoryUpdated(event: InventoryEvent): void;
  emitInventoryCreated(productId: string, quantity: number): void;
}
