export class Inventory {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public quantity: number,
    public updatedAt: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.productId || this.productId.trim().length === 0) {
      throw new Error('Product ID is required');
    }

    if (typeof this.quantity !== 'number' || isNaN(this.quantity)) {
      throw new Error('Quantity must be a valid number');
    }

    if (this.quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }
  }

  public updateQuantity(delta: number): void {
    const newQuantity = this.quantity + delta;
    
    if (newQuantity < 0) {
      throw new Error('Insufficient inventory: resulting quantity would be negative');
    }

    this.quantity = newQuantity;
    this.updatedAt = new Date();
  }

  public setQuantity(quantity: number): void {
    if (quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }

    this.quantity = quantity;
    this.updatedAt = new Date();
  }

  public toJSON() {
    return {
      id: this.id,
      productId: this.productId,
      quantity: this.quantity,
      updatedAt: this.updatedAt
    };
  }
}
