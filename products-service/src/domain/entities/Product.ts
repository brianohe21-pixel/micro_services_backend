export class Product {
  constructor(
    public readonly id: string,
    public name: string,
    public description: string,
    public price: number,
    public readonly createdAt: Date,
    public updatedAt: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Product name is required');
    }

    if (this.price < 0) {
      throw new Error('Product price cannot be negative');
    }

    if (this.name.length > 255) {
      throw new Error('Product name cannot exceed 255 characters');
    }

    if (this.description && this.description.length > 1000) {
      throw new Error('Product description cannot exceed 1000 characters');
    }
  }

  public update(data: Partial<Pick<Product, 'name' | 'description' | 'price'>>): void {
    if (data.name !== undefined) {
      this.name = data.name;
    }
    if (data.description !== undefined) {
      this.description = data.description;
    }
    if (data.price !== undefined) {
      this.price = data.price;
    }
    this.updatedAt = new Date();
    this.validate();
  }

  public toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
