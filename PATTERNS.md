# Patrones de Diseño Implementados

Este documento detalla los patrones de diseño utilizados en el proyecto y su justificación.

## Patrones Arquitectónicos

### 1. Hexagonal Architecture (Ports and Adapters)

**Ubicación**: Estructura completa de ambos microservicios

**Implementación**:
```
src/
├── domain/           # Núcleo del negocio (puertos)
│   ├── entities/
│   ├── repositories/  # Interfaces (puertos)
│   └── services/      # Interfaces (puertos)
├── application/      # Casos de uso
│   └── use-cases/
└── infrastructure/   # Adaptadores
    ├── database/     # Adaptador de persistencia
    ├── http/         # Adaptador de entrada HTTP
    └── events/       # Adaptador de eventos
```

**Beneficios**:
- Dominio independiente de frameworks
- Fácil testing con mocks
- Cambio de tecnología sin afectar lógica
- Escalabilidad del equipo

**Ejemplo**:
```typescript
// Puerto (Domain)
export interface IProductRepository {
  create(product: Product): Promise<Product>;
  findById(id: string): Promise<Product | null>;
}

// Adaptador (Infrastructure)
export class ProductRepository implements IProductRepository {
  // Implementación con TypeORM
}
```

---

## Patrones Creacionales

### 2. Factory Pattern

**Ubicación**: Creación de entidades de dominio

**Implementación**:
```typescript
// products-service/src/domain/entities/Product.ts
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
    // ... más validaciones
  }
}
```

**Beneficios**:
- Validación centralizada
- Garantiza invariantes del dominio
- Encapsulación de lógica de creación

---

### 3. Dependency Injection (Manual)

**Ubicación**: Construcción de casos de uso y controladores

**Implementación**:
```typescript
// products-service/src/infrastructure/http/routes/products.routes.ts
export const createProductsRouter = (): Router => {
  const router = Router();
  
  // Inyección de dependencias manual
  const productRepository = new ProductRepository();
  const createProductUseCase = new CreateProductUseCase(productRepository);
  const controller = new ProductController(createProductUseCase);

  router.post('/products', (req, res, next) => 
    controller.create(req, res, next)
  );

  return router;
};
```

**Beneficios**:
- Desacoplamiento entre capas
- Fácil testing con mocks
- Flexibilidad para cambiar implementaciones
- No requiere framework adicional

---

## Patrones Estructurales

### 4. Repository Pattern

**Ubicación**: Capa de dominio e infraestructura

**Implementación**:
```typescript
// Domain - Interface (Puerto)
export interface IProductRepository {
  create(product: Product): Promise<Product>;
  findById(id: string): Promise<Product | null>;
  update(id: string, data: Partial<Product>): Promise<Product>;
  delete(id: string): Promise<void>;
  findAll(page: number, limit: number): Promise<PaginatedResult<Product>>;
}

// Infrastructure - Implementation (Adaptador)
export class ProductRepository implements IProductRepository {
  private repository: Repository<ProductEntity>;

  async create(product: Product): Promise<Product> {
    const entity = this.toEntity(product);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }
  // ... más métodos
}
```

**Beneficios**:
- Abstracción de la persistencia
- Cambio de BD sin afectar lógica
- Testing sin base de datos real
- Separación de responsabilidades

---

### 5. Adapter Pattern

**Ubicación**: Cliente HTTP para comunicación entre servicios

**Implementación**:
```typescript
// inventory-service/src/infrastructure/http/ProductsServiceClient.ts
export class ProductsServiceClient implements IProductValidationService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.PRODUCTS_SERVICE_URL,
      timeout: 5000,
      headers: { 'X-API-Key': process.env.PRODUCTS_SERVICE_API_KEY }
    });
  }

  async validateProductExists(productId: string): Promise<boolean> {
    try {
      await this.axiosInstance.get(`/api/v1/products/${productId}`);
      return true;
    } catch (error) {
      return this.handleError(error, productId, false);
    }
  }
}
```

**Beneficios**:
- Adapta API externa a interfaz interna
- Manejo centralizado de errores
- Configuración de retry y timeout
- Fácil mockear en tests

---

## Patrones Comportamentales

### 6. Strategy Pattern

**Ubicación**: Estrategias de retry en cliente HTTP

**Implementación**:
```typescript
// inventory-service/src/infrastructure/http/ProductsServiceClient.ts
axiosRetry(this.axiosInstance, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,  // Estrategia de delay
  retryCondition: (error: AxiosError) => {
    // Estrategia de cuándo reintentar
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           (error.response?.status ? error.response.status >= 500 : false);
  }
});
```

**Beneficios**:
- Diferentes estrategias de retry
- Configuración flexible
- Separación de concerns
- Fácil agregar nuevas estrategias

---

### 7. Template Method Pattern (Implícito)

**Ubicación**: Estructura de casos de uso

**Implementación**:
```typescript
// Estructura común en todos los casos de uso
export class CreateProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(dto: CreateProductDTO): Promise<Product> {
    // 1. Validar entrada
    this.validateDTO(dto);

    // 2. Crear entidad de dominio
    const product = new Product(/*...*/);

    // 3. Persistir
    return await this.productRepository.create(product);
  }

  private validateDTO(dto: CreateProductDTO): void {
    // Validación específica
  }
}
```

**Beneficios**:
- Estructura consistente
- Fácil entender flujo
- Reutilización de pasos comunes
- Mantenibilidad

---

## Patrones de Resiliencia

### 8. Retry Pattern

**Ubicación**: Cliente HTTP entre servicios

**Implementación**:
```typescript
axiosRetry(this.axiosInstance, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: AxiosError) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           (error.response?.status ? error.response.status >= 500 : false);
  },
  onRetry: (retryCount, error, requestConfig) => {
    logger.warn('Retrying request', { retryCount, url: requestConfig.url });
  }
});
```

**Características**:
- 3 intentos máximo
- Exponential backoff (1s, 2s, 4s)
- Solo en errores 5xx y red
- Logging de reintentos

---

### 9. Timeout Pattern

**Ubicación**: Cliente HTTP

**Implementación**:
```typescript
this.axiosInstance = axios.create({
  baseURL: process.env.PRODUCTS_SERVICE_URL,
  timeout: 5000,  // 5 segundos
  headers: { 'X-API-Key': process.env.PRODUCTS_SERVICE_API_KEY }
});
```

**Manejo**:
```typescript
if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
  throw new TimeoutError('Products service');
}
```

---

### 10. Circuit Breaker Pattern (Propuesto)

**Implementación futura con Opossum**:
```typescript
import CircuitBreaker from 'opossum';

const options = {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
};

const breaker = new CircuitBreaker(
  async (productId: string) => {
    return await this.axiosInstance.get(`/api/v1/products/${productId}`);
  },
  options
);

breaker.on('open', () => {
  logger.error('Circuit breaker opened - too many failures');
});

breaker.on('halfOpen', () => {
  logger.info('Circuit breaker half-open - testing service');
});
```

---

## Patrones de API

### 11. JSON:API Standard

**Ubicación**: Serialización de respuestas

**Implementación**:
```typescript
// products-service/src/infrastructure/http/serializers/ProductSerializer.ts
const productSerializer = new Serializer('products', {
  attributes: ['name', 'description', 'price', 'createdAt', 'updatedAt'],
  keyForAttribute: 'camelCase',
  pluralizeType: false
});

export class ProductSerializer {
  static serialize(product: Product) {
    return productSerializer.serialize(product.toJSON());
  }
}
```

**Respuesta**:
```json
{
  "data": {
    "type": "products",
    "id": "123",
    "attributes": {
      "name": "Laptop",
      "price": 1500
    }
  }
}
```

---

### 12. Pagination Pattern

**Ubicación**: Listado de productos

**Implementación**:
```typescript
// Query params: ?page[number]=1&page[size]=10
const result = await this.productRepository.findAll(page, limit);

// Respuesta con metadata
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  },
  "links": {
    "self": "/api/v1/products?page[number]=1&page[size]=10",
    "first": "/api/v1/products?page[number]=1&page[size]=10",
    "last": "/api/v1/products?page[number]=10&page[size]=10",
    "next": "/api/v1/products?page[number]=2&page[size]=10"
  }
}
```

---

## Patrones de Logging

### 13. Structured Logging

**Ubicación**: Todos los servicios

**Implementación**:
```typescript
// infrastructure/logging/logger.ts
export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'products-service' }
});

// Uso
logger.info('HTTP Request', {
  method: req.method,
  path: req.path,
  statusCode: res.statusCode,
  duration: `${duration}ms`
});
```

**Salida**:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "message": "HTTP Request",
  "service": "products-service",
  "method": "GET",
  "path": "/api/v1/products",
  "statusCode": 200,
  "duration": "45ms"
}
```

---

## Patrones de Testing

### 14. Test Doubles (Mocks)

**Ubicación**: Pruebas unitarias

**Implementación**:
```typescript
describe('CreateProductUseCase', () => {
  let mockRepository: jest.Mocked<IProductRepository>;
  let useCase: CreateProductUseCase;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      // ... más métodos
    };
    useCase = new CreateProductUseCase(mockRepository);
  });

  it('should create a product', async () => {
    mockRepository.create.mockResolvedValue(mockProduct);
    const result = await useCase.execute(dto);
    expect(mockRepository.create).toHaveBeenCalled();
  });
});
```

---

### 15. HTTP Mocking

**Ubicación**: Pruebas de integración

**Implementación**:
```typescript
import nock from 'nock';

describe('Inventory API', () => {
  it('should handle product not found', async () => {
    nock('http://products-service:3001')
      .get('/api/v1/products/999')
      .reply(404);

    const response = await request(app)
      .get('/api/v1/inventory/999')
      .expect(404);
  });
});
```

---

## Patrones de Seguridad

### 16. Middleware Chain

**Ubicación**: Express middleware

**Implementación**:
```typescript
app.use(helmet());                    // Seguridad HTTP
app.use(cors());                      // CORS
app.use(express.json());              // Body parser
app.use(requestLogger);               // Logging
app.use('/api/v1', apiKeyAuth, routes);  // Auth + Routes
app.use(errorHandler);                // Error handling
```

---

## Resumen de Patrones

| Patrón | Categoría | Beneficio Principal |
|--------|-----------|---------------------|
| Hexagonal Architecture | Arquitectónico | Desacoplamiento |
| Factory | Creacional | Validación centralizada |
| Dependency Injection | Creacional | Testabilidad |
| Repository | Estructural | Abstracción de datos |
| Adapter | Estructural | Integración de servicios |
| Strategy | Comportamental | Flexibilidad |
| Template Method | Comportamental | Consistencia |
| Retry | Resiliencia | Tolerancia a fallos |
| Timeout | Resiliencia | Prevención de bloqueos |
| Circuit Breaker | Resiliencia | Protección en cascada |
| JSON:API | API | Estandarización |
| Pagination | API | Rendimiento |
| Structured Logging | Observabilidad | Trazabilidad |
| Test Doubles | Testing | Aislamiento |
| Middleware Chain | Seguridad | Separación de concerns |

---

## Patrones Futuros a Considerar

### CQRS (Command Query Responsibility Segregation)
- Separar lecturas de escrituras
- Optimizar cada operación independientemente
- Escalado diferenciado

### Event Sourcing
- Historial completo de cambios
- Auditoría completa
- Reconstrucción de estado

### Saga Pattern
- Transacciones distribuidas
- Compensación de errores
- Consistencia eventual

### API Gateway Pattern
- Punto de entrada único
- Autenticación centralizada
- Rate limiting global

### Service Mesh
- Manejo de tráfico avanzado
- Observabilidad automática
- Seguridad entre servicios