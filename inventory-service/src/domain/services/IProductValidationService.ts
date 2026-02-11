export interface ProductDTO {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface IProductValidationService {
  validateProductExists(productId: string): Promise<boolean>;
  getProductDetails(productId: string): Promise<ProductDTO>;
}
