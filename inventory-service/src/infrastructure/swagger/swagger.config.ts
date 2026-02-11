import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Inventory Service API',
      version: '1.0.0',
      description: 'Microservicio de gestión de inventario siguiendo el estándar JSON:API',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:3002',
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
        Inventory: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              example: 'inventory'
            },
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            attributes: {
              type: 'object',
              properties: {
                productId: {
                  type: 'string',
                  format: 'uuid',
                  example: '456e7890-e89b-12d3-a456-426614174111'
                },
                quantity: {
                  type: 'integer',
                  minimum: 0,
                  example: 100
                },
                updatedAt: {
                  type: 'string',
                  format: 'date-time'
                }
              }
            }
          }
        },
        InventoryInput: {
          type: 'object',
          required: ['productId', 'quantity'],
          properties: {
            productId: {
              type: 'string',
              format: 'uuid',
              example: '456e7890-e89b-12d3-a456-426614174111'
            },
            quantity: {
              type: 'integer',
              minimum: 0,
              example: 100
            }
          }
        },
        InventoryUpdate: {
          type: 'object',
          required: ['quantity'],
          properties: {
            quantity: {
              type: 'integer',
              minimum: 0,
              example: 95
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
        name: 'Inventory',
        description: 'Inventory management endpoints'
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
