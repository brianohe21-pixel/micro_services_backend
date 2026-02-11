# Microservicios Backend - Prueba Técnica Senior

Sistema de microservicios para gestión de productos e inventario, implementado con Node.js/TypeScript, siguiendo arquitectura hexagonal y el estándar JSON:API.

## Arquitectura

El sistema está compuesto por dos microservicios independientes que se comunican mediante HTTP:

```
┌─────────────────┐         ┌──────────────────┐
│                 │         │                  │
│  Products       │◄────────│   Inventory      │
│  Service        │  HTTP   │   Service        │
│  (Port 3001)    │  +API   │   (Port 3002)    │
│                 │  Key    │                  │
└────────┬────────┘         └────────┬─────────┘
         │                           │
         │                           │
    ┌────▼────┐                 ┌────▼────┐
    │PostgreSQL│                │PostgreSQL│
    │Products  │                │Inventory │
    │   DB     │                │   DB     │
    └──────────┘                └──────────┘
```

### Flujo de Comunicación

```
Cliente → Inventory Service → Products Service
                ↓                      ↓
          Inventory DB            Products DB
```

El servicio de inventario **no duplica** información de productos. Siempre valida la existencia del producto consultando al servicio de productos antes de realizar operaciones.

## Stack Tecnológico

### Backend
- **Node.js 20 LTS** - Runtime de JavaScript
- **TypeScript 5.x** - Tipado estático
- **Express.js** - Framework web
- **TypeORM** - ORM para PostgreSQL
- **PostgreSQL 16** - Base de datos relacional

### Librerías Principales
- `jsonapi-serializer` - Serialización JSON:API
- `axios` + `axios-retry` - Cliente HTTP con reintentos automáticos
- `helmet` - Seguridad HTTP
- `zod` - Validación de esquemas
- `winston` - Logging estructurado
- `swagger-jsdoc` + `swagger-ui-express` - Documentación OpenAPI

### Testing
- `jest` - Framework de pruebas
- `supertest` - Pruebas de integración HTTP
- `nock` - Mock de servicios HTTP

### DevOps
- **Docker** - Containerización
- **Docker Compose** - Orquestación de servicios

## Estructura del Proyecto

```
micro_services_backend/
├── products-service/          # Microservicio de productos
│   ├── src/
│   │   ├── domain/           # Capa de dominio (entidades, interfaces)
│   │   ├── application/      # Casos de uso
│   │   └── infrastructure/   # Adaptadores (DB, HTTP, etc)
│   ├── tests/
│   │   ├── unit/            # Pruebas unitarias
│   │   └── integration/     # Pruebas de integración
│   ├── Dockerfile
│   └── package.json
├── inventory-service/         # Microservicio de inventario
│   └── (misma estructura)
├── docker-compose.yml
└── README.md
```

### Arquitectura Hexagonal

Cada microservicio sigue el patrón de arquitectura hexagonal (puertos y adaptadores):

- **Domain**: Lógica de negocio pura, sin dependencias externas
- **Application**: Casos de uso que orquestan el dominio
- **Infrastructure**: Adaptadores para BD, HTTP, logging, etc.

## Instalación y Ejecución

### Prerrequisitos

- Docker y Docker Compose instalados
- Node.js 20+ (solo para desarrollo local)
- PostgreSQL 16 (solo para desarrollo local sin Docker)

### Ejecución con Docker (Recomendado)

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd micro_services_backend
```

2. Configurar variables de entorno (opcional):
```bash
cp .env.example .env
```

3. Iniciar todos los servicios:
```bash
docker-compose up --build
```

Los servicios estarán disponibles en:
- **Products Service**: http://localhost:3001
- **Inventory Service**: http://localhost:3002
- **Products API Docs**: http://localhost:3001/api-docs
- **Inventory API Docs**: http://localhost:3002/api-docs

4. Verificar el estado de los servicios:
```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
```

### Ejecución en Desarrollo Local

Para cada servicio:

```bash
cd products-service  # o inventory-service
npm install
npm run dev
```

## Uso de la API

### Autenticación

Todas las peticiones a los endpoints de la API requieren un API Key en el header:

```bash
X-API-Key: secret-key-products-123
```

### Ejemplos con curl

#### Crear un producto
```bash
curl -X POST http://localhost:3001/api/v1/products \
  -H "X-API-Key: secret-key-products-123" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop Gaming",
    "description": "High-performance gaming laptop",
    "price": 1500
  }'
```

#### Listar productos con paginación
```bash
curl -X GET "http://localhost:3001/api/v1/products?page[number]=1&page[size]=10" \
  -H "X-API-Key: secret-key-products-123"
```

#### Crear inventario para un producto
```bash
curl -X POST http://localhost:3002/api/v1/inventory \
  -H "X-API-Key: secret-key-inventory-123" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "<product-id>",
    "quantity": 100
  }'
```

#### Consultar inventario de un producto
```bash
curl -X GET http://localhost:3002/api/v1/inventory/<product-id> \
  -H "X-API-Key: secret-key-inventory-123"
```

#### Actualizar cantidad de inventario
```bash
curl -X PATCH http://localhost:3002/api/v1/inventory/<product-id> \
  -H "X-API-Key: secret-key-inventory-123" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 95
  }'
```

### Formato de Respuestas JSON:API

Todas las respuestas siguen el estándar JSON:API:

**Éxito (200/201):**
```json
{
  "data": {
    "type": "products",
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "attributes": {
      "name": "Laptop Gaming",
      "description": "High-performance gaming laptop",
      "price": 1500,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Error (4xx/5xx):**
```json
{
  "errors": [{
    "status": "404",
    "title": "Not Found",
    "detail": "Product with id xyz not found"
  }]
}
```

## Pruebas

### Ejecutar todas las pruebas

```bash
cd products-service
npm test

cd ../inventory-service
npm test
```

### Ejecutar con cobertura

```bash
npm run test:coverage
```

### Pruebas Implementadas

#### Pruebas Unitarias
- Creación y actualización de productos
- Actualización de inventario
- Validaciones de datos
- Manejo de errores de dominio

#### Pruebas de Integración
- Comunicación entre microservicios
- Manejo de errores (producto inexistente, fallos de red, timeouts)
- Autenticación con API Keys
- Reintentos automáticos en fallos 5xx
- Paginación de resultados

## Decisiones Técnicas

### Node.js + TypeScript
- Ecosistema maduro con amplia comunidad
- Tipado estático previene errores en tiempo de compilación
- Excelente rendimiento para I/O intensivo
- Fácil integración con herramientas modernas

### PostgreSQL
- **ACID**: Garantiza consistencia en transacciones
- **Relaciones**: Productos e inventario tienen relaciones claras
- **Escalabilidad**: Soporte para read replicas y sharding
- **JSON nativo**: Flexibilidad para datos semi-estructurados

### Arquitectura Hexagonal
- **Testabilidad**: Fácil crear mocks de puertos
- **Desacoplamiento**: Dominio independiente de frameworks
- **Mantenibilidad**: Cambios en infraestructura no afectan lógica
- **Escalabilidad del equipo**: Capas bien definidas

### TypeORM
- ORM robusto con soporte completo de TypeScript
- Sistema de migraciones integrado
- Active Record y Data Mapper patterns
- Excelente soporte para PostgreSQL

### JSON:API
- Estándar consolidado para APIs REST
- Estructura consistente de respuestas
- Soporte nativo para paginación, filtros y relaciones
- Reduce ambigüedad en el diseño de APIs

### Axios + Retry
- Cliente HTTP maduro y confiable
- Interceptors para logging y autenticación
- Retry automático con exponential backoff
- Manejo robusto de timeouts y errores de red

## Manejo de Errores y Resiliencia

### Timeouts
- Timeout de 5 segundos en llamadas entre servicios
- Respuesta 504 Gateway Timeout al cliente

### Reintentos
- 3 intentos automáticos en errores 5xx
- Exponential backoff entre reintentos
- Solo en operaciones idempotentes (GET)

### Manejo de Errores
- **404**: Producto/inventario no encontrado
- **400**: Validación de datos fallida
- **401**: API Key inválida o faltante
- **503**: Servicio externo no disponible
- **504**: Timeout en servicio externo
- **500**: Error interno del servidor

### Logging Estructurado
- Formato JSON para fácil parsing
- Niveles: error, warn, info, debug
- Incluye contexto: timestamp, service, request ID
- Eventos de inventario registrados en logs

## Suposiciones Realizadas

1. **API Keys**: Se comparten mediante variables de entorno. En producción se usaría un secret manager (AWS Secrets Manager, Vault).

2. **Inventario sin duplicación**: El servicio de inventario no replica datos del producto, solo mantiene la cantidad disponible.

3. **Eventos como logs**: Los eventos de cambio de inventario se emiten como logs estructurados. En un sistema real se usaría un message broker (RabbitMQ, Kafka).

4. **Base de datos por servicio**: Cada microservicio tiene su propia base de datos, siguiendo el patrón de microservicios.

5. **Sincronía en comunicación**: La comunicación entre servicios es síncrona vía HTTP. Para operaciones críticas se consideraría comunicación asíncrona.

6. **Validación en ambos lados**: Tanto el dominio como la infraestructura validan datos para mayor robustez.

## Mejoras Futuras

### Corto Plazo
- **Circuit Breaker**: Implementar patrón circuit breaker con Opossum para evitar cascadas de fallos
- **Health Checks**: Endpoints `/health/liveness` y `/health/readiness` para Kubernetes
- **Métricas**: Integrar Prometheus para métricas de negocio y técnicas
- **Rate Limiting**: Limitar peticiones por cliente para prevenir abuso

### Mediano Plazo
- **Message Broker**: RabbitMQ o Kafka para eventos asíncronos
- **API Gateway**: Kong o AWS API Gateway para centralizar autenticación y routing
- **Service Discovery**: Consul o Eureka para registro dinámico de servicios
- **Distributed Tracing**: OpenTelemetry + Jaeger para trazabilidad end-to-end
- **Cache distribuido**: Redis para cachear consultas frecuentes

### Largo Plazo
- **CQRS + Event Sourcing**: Separar lecturas/escrituras y mantener historial completo
- **Database Sharding**: Particionar datos por rango de IDs para escalar horizontalmente
- **Read Replicas**: Separar lecturas de escrituras en base de datos
- **Service Mesh**: Istio para manejo avanzado de tráfico y seguridad
- **GraphQL Gateway**: Capa GraphQL sobre microservicios para queries flexibles
- **Observabilidad completa**: Grafana + Prometheus + Jaeger + ELK Stack

### Escalabilidad
- **Horizontal Scaling**: Múltiples instancias detrás de load balancer
- **Auto-scaling**: Kubernetes HPA basado en CPU/memoria/custom metrics
- **CDN**: CloudFront o Cloudflare para contenido estático
- **Database Optimization**: Índices, query optimization, connection pooling

## Documentación de la API

La documentación interactiva de Swagger está disponible en:

- **Products Service**: http://localhost:3001/api-docs
- **Inventory Service**: http://localhost:3002/api-docs

También puedes obtener la especificación OpenAPI en formato JSON:

- http://localhost:3001/api-docs.json
- http://localhost:3002/api-docs.json

## Comandos Útiles

```bash
# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f products-service
docker-compose logs -f inventory-service

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v

# Rebuild de servicios
docker-compose up --build

# Ejecutar tests en contenedor
docker-compose exec products-service npm test
docker-compose exec inventory-service npm test

# Acceder a base de datos
docker-compose exec products-db psql -U postgres -d products_db
docker-compose exec inventory-db psql -U postgres -d inventory_db
```

## Patrones de Diseño Implementados

1. **Repository Pattern**: Abstracción de la capa de persistencia
2. **Dependency Injection**: Inyección manual de dependencias para desacoplamiento
3. **Factory Pattern**: Creación de entidades de dominio
4. **Strategy Pattern**: Diferentes estrategias de retry en cliente HTTP
5. **Adapter Pattern**: Adaptadores para servicios externos (ProductsServiceClient)
6. **Port and Adapter (Hexagonal)**: Arquitectura completa de cada servicio

## Versionado de API

El sistema implementa versionado basado en URL:

- `/api/v1/products` - Versión 1 de la API de productos
- `/api/v1/inventory` - Versión 1 de la API de inventario

**Estrategia de versionado:**
- Versionado en URL para claridad y facilidad de uso
- Múltiples versiones pueden coexistir
- Deprecación gradual de versiones antiguas
- Documentación separada por versión