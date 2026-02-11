import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Products Service API',
      version: '1.0.0',
      description: 'Microservicio de gestión de productos siguiendo el estándar JSON:API',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API Key for authentication'
        }
      },
      schemas: {
        Product: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              example: 'products'
            },
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            attributes: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  example: 'Laptop'
                },
                description: {
                  type: 'string',
                  example: 'High-performance gaming laptop'
                },
                price: {
                  type: 'number',
                  example: 1500.00
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time'
                },
                updatedAt: {
                  type: 'string',
                  format: 'date-time'
                }
              }
            }
          }
        },
        ProductInput: {
          type: 'object',
          required: ['name', 'description', 'price'],
          properties: {
            name: {
              type: 'string',
              maxLength: 255,
              example: 'Laptop'
            },
            description: {
              type: 'string',
              maxLength: 1000,
              example: 'High-performance gaming laptop'
            },
            price: {
              type: 'number',
              minimum: 0,
              example: 1500.00
            }
          }
        },
        ProductUpdate: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              maxLength: 255,
              example: 'Updated Laptop'
            },
            description: {
              type: 'string',
              maxLength: 1000,
              example: 'Updated description'
            },
            price: {
              type: 'number',
              minimum: 0,
              example: 1600.00
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    example: '404'
                  },
                  title: {
                    type: 'string',
                    example: 'Not Found'
                  },
                  detail: {
                    type: 'string',
                    example: 'Product with id xyz not found'
                  }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        ApiKeyAuth: []
      }
    ],
    tags: [
      {
        name: 'Products',
        description: 'Product management endpoints'
      },
      {
        name: 'Health',
        description: 'Health check endpoints'
      }
    ]
  },
  apis: ['./src/infrastructure/swagger/paths/*.yaml', './src/infrastructure/http/routes/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
