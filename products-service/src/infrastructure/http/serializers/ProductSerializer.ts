import { Serializer } from 'jsonapi-serializer';
import { Product } from '../../../domain/entities/Product';
import { PaginatedResult } from '../../../domain/repositories/IProductRepository';

const productSerializer = new Serializer('products', {
  attributes: ['name', 'description', 'price', 'createdAt', 'updatedAt'],
  keyForAttribute: 'camelCase',
  pluralizeType: false
});

export class ProductSerializer {
  static serialize(product: Product) {
    return productSerializer.serialize(product.toJSON());
  }

  static serializeList(result: PaginatedResult<Product>) {
    const products = result.data.map(p => p.toJSON());
    
    const serialized = productSerializer.serialize(products);
    
    serialized.meta = {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    };

    serialized.links = {
      self: `/api/v1/products?page[number]=${result.page}&page[size]=${result.limit}`,
      first: `/api/v1/products?page[number]=1&page[size]=${result.limit}`,
      last: `/api/v1/products?page[number]=${result.totalPages}&page[size]=${result.limit}`
    };

    if (result.page > 1) {
      serialized.links.prev = `/api/v1/products?page[number]=${result.page - 1}&page[size]=${result.limit}`;
    }

    if (result.page < result.totalPages) {
      serialized.links.next = `/api/v1/products?page[number]=${result.page + 1}&page[size]=${result.limit}`;
    }

    return serialized;
  }
}
