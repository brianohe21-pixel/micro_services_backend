import axios, { AxiosInstance, AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { IProductValidationService, ProductDTO } from '../../domain/services/IProductValidationService';
import { ProductNotFoundError, ServiceUnavailableError, TimeoutError } from '../../domain/errors/DomainErrors';
import { logger } from '../logging/logger';

export class ProductsServiceClient implements IProductValidationService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3001',
      timeout: 5000,
      headers: {
        'X-API-Key': process.env.PRODUCTS_SERVICE_API_KEY || '',
        'Content-Type': 'application/json'
      }
    });

    axiosRetry(this.axiosInstance, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error: AxiosError) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
               (error.response?.status ? error.response.status >= 500 : false);
      },
      onRetry: (retryCount, error, requestConfig) => {
        logger.warn('Retrying request to products service', {
          retryCount,
          url: requestConfig.url,
          error: error.message
        });
      }
    });
  }

  async validateProductExists(productId: string): Promise<boolean> {
    try {
      logger.info('Validating product existence', { productId });
      
      await this.axiosInstance.get(`/api/v1/products/${productId}`);
      
      logger.info('Product exists', { productId });
      return true;
    } catch (error) {
      return this.handleError(error, productId, false);
    }
  }

  async getProductDetails(productId: string): Promise<ProductDTO> {
    try {
      logger.info('Fetching product details', { productId });
      
      const response = await this.axiosInstance.get(`/api/v1/products/${productId}`);
      
      const productData = response.data.data;
      
      const product: ProductDTO = {
        id: productData.id,
        name: productData.attributes.name,
        description: productData.attributes.description,
        price: productData.attributes.price
      };

      logger.info('Product details fetched successfully', { productId });
      return product;
    } catch (error) {
      return this.handleError(error, productId, true);
    }
  }

  private handleError(error: unknown, productId: string, throwError: boolean): any {
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      const status = axiosError.response.status;
      
      logger.error('Products service responded with error', {
        productId,
        status,
        message: axiosError.message
      });

      if (status === 404) {
        if (throwError) {
          throw new ProductNotFoundError(productId);
        }
        return false;
      }

      if (status >= 500) {
        throw new ServiceUnavailableError('Products service');
      }
    }

    if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
      logger.error('Request to products service timed out', {
        productId,
        code: axiosError.code
      });
      throw new TimeoutError('Products service');
    }

    if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND') {
      logger.error('Cannot connect to products service', {
        productId,
        code: axiosError.code
      });
      throw new ServiceUnavailableError('Products service');
    }

    logger.error('Unexpected error communicating with products service', {
      productId,
      error: axiosError.message
    });
    throw new ServiceUnavailableError('Products service');
  }
}
