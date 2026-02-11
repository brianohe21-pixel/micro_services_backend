# Arquitectura del Sistema

## Diagrama de Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                         Cliente / Tests                          │
└────────────────┬────────────────────────────────┬────────────────┘
                 │                                │
                 │ HTTP + API Key                 │ HTTP + API Key
                 │                                │
        ┌────────▼────────┐              ┌────────▼────────┐
        │                 │              │                 │
        │   Products      │◄─────────────│   Inventory     │
        │   Service       │  HTTP + Key  │   Service       │
        │   :3001         │              │   :3002         │
        │                 │              │                 │
        └────────┬────────┘              └────────┬────────┘
                 │                                │
                 │                                │
        ┌────────▼────────┐              ┌────────▼────────┐
        │   PostgreSQL    │              │   PostgreSQL    │
        │   products_db   │              │  inventory_db   │
        │   :5432         │              │   :5433         │
        └─────────────────┘              └─────────────────┘
```

## Arquitectura Hexagonal por Servicio

```
┌─────────────────────────────────────────────────────────────┐
│                    Microservicio                             │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Infrastructure Layer                   │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │    │
│  │  │   HTTP   │  │ Database │  │  Logger  │        │    │
│  │  │ Express  │  │ TypeORM  │  │ Winston  │        │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘        │    │
│  └───────┼─────────────┼─────────────┼───────────────┘    │
│          │             │             │                     │
│  ┌───────▼─────────────▼─────────────▼───────────────┐    │
│  │            Application Layer                       │    │
│  │         (Use Cases / Ports)                        │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │    │
│  │  │ Create   │  │  Update  │  │  Delete  │        │    │
│  │  │ UseCase  │  │ UseCase  │  │ UseCase  │        │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘        │    │
│  └───────┼─────────────┼─────────────┼───────────────┘    │
│          │             │             │                     │
│  ┌───────▼─────────────▼─────────────▼───────────────┐    │
│  │              Domain Layer                          │    │
│  │         (Entities / Business Logic)                │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │    │
│  │  │ Product  │  │Repository│  │  Errors  │        │    │
│  │  │ Entity   │  │Interface │  │          │        │    │
│  │  └──────────┘  └──────────┘  └──────────┘        │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Flujo de Comunicación entre Servicios

### Escenario 1: Consulta de Inventario Exitosa

```
┌────────┐         ┌───────────┐         ┌──────────┐         ┌────────┐
│ Client │         │ Inventory │         │ Products │         │   DB   │
└───┬────┘         └─────┬─────┘         └────┬─────┘         └───┬────┘
    │                    │                    │                    │
    │ GET /inventory/123 │                    │                    │
    ├───────────────────►│                    │                    │
    │                    │                    │                    │
    │                    │ GET /products/123  │                    │
    │                    ├───────────────────►│                    │
    │                    │                    │                    │
    │                    │                    │ SELECT * FROM...   │
    │                    │                    ├───────────────────►│
    │                    │                    │                    │
    │                    │                    │ Product Data       │
    │                    │                    │◄───────────────────┤
    │                    │                    │                    │
    │                    │ 200 OK (Product)   │                    │
    │                    │◄───────────────────┤                    │
    │                    │                    │                    │
    │                    │ SELECT * FROM...   │                    │
    │                    ├────────────────────┼────────────────────►
    │                    │                    │                    │
    │                    │ Inventory Data     │                    │
    │                    │◄────────────────────────────────────────┤
    │                    │                    │                    │
    │ 200 OK (Inventory) │                    │                    │
    │◄───────────────────┤                    │                    │
    │                    │                    │                    │
```

### Escenario 2: Producto No Encontrado

```
┌────────┐         ┌───────────┐         ┌──────────┐
│ Client │         │ Inventory │         │ Products │
└───┬────┘         └─────┬─────┘         └────┬─────┘
    │                    │                    │
    │ GET /inventory/999 │                    │
    ├───────────────────►│                    │
    │                    │                    │
    │                    │ GET /products/999  │
    │                    ├───────────────────►│
    │                    │                    │
    │                    │ 404 Not Found      │
    │                    │◄───────────────────┤
    │                    │                    │
    │ 404 Not Found      │                    │
    │◄───────────────────┤                    │
    │                    │                    │
```

### Escenario 3: Timeout del Servicio

```
┌────────┐         ┌───────────┐         ┌──────────┐
│ Client │         │ Inventory │         │ Products │
└───┬────┘         └─────┬─────┘         └────┬─────┘
    │                    │                    │
    │ GET /inventory/123 │                    │
    ├───────────────────►│                    │
    │                    │                    │
    │                    │ GET /products/123  │
    │                    ├───────────────────►│
    │                    │                    │
    │                    │  ... 5s timeout... │
    │                    │                    │
    │                    │ TIMEOUT            │
    │                    │◄───────────────────┤
    │                    │                    │
    │ 504 Gateway Timeout│                    │
    │◄───────────────────┤                    │
    │                    │                    │
```

### Escenario 4: Retry en Error 500

```
┌────────┐         ┌───────────┐         ┌──────────┐
│ Client │         │ Inventory │         │ Products │
└───┬────┘         └─────┬─────┘         └────┬─────┘
    │                    │                    │
    │ GET /inventory/123 │                    │
    ├───────────────────►│                    │
    │                    │                    │
    │                    │ GET /products/123  │
    │                    ├───────────────────►│
    │                    │                    │
    │                    │ 500 Error          │
    │                    │◄───────────────────┤
    │                    │                    │
    │                    │ Retry 1 (1s delay) │
    │                    ├───────────────────►│
    │                    │                    │
    │                    │ 500 Error          │
    │                    │◄───────────────────┤
    │                    │                    │
    │                    │ Retry 2 (2s delay) │
    │                    ├───────────────────►│
    │                    │                    │
    │                    │ 200 OK             │
    │                    │◄───────────────────┤
    │                    │                    │
    │ 200 OK (Inventory) │                    │
    │◄───────────────────┤                    │
    │                    │                    │
```

## Modelo de Datos

### Products Service

```sql
CREATE TABLE products (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_created_at ON products(created_at DESC);
```

### Inventory Service

```sql
CREATE TABLE inventory (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL UNIQUE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_product_id ON inventory(product_id);
```

## Patrones de Resiliencia Implementados

### 1. Retry Pattern
- 3 intentos automáticos
- Exponential backoff (1s, 2s, 4s)
- Solo en errores 5xx y errores de red

### 2. Timeout Pattern
- Timeout de 5 segundos
- Previene bloqueos indefinidos
- Respuesta 504 al cliente

### 3. Circuit Breaker (Propuesto)
```
┌─────────────────────────────────────────┐
│         Circuit Breaker States          │
│                                         │
│  ┌────────┐    Failures    ┌─────────┐ │
│  │ CLOSED ├───────────────►│  OPEN   │ │
│  └───┬────┘   threshold    └────┬────┘ │
│      │                          │      │
│      │                          │      │
│      │      Success             │      │
│      │    ◄─────────────────────┘      │
│      │         timeout                 │
│      │                                 │
│  ┌───▼────────┐                        │
│  │ HALF-OPEN  │                        │
│  └────────────┘                        │
└─────────────────────────────────────────┘
```

## Estrategia de Escalabilidad

### Horizontal Scaling

```
                    ┌──────────────┐
                    │ Load Balancer│
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼─────┐    ┌─────▼─────┐   ┌─────▼─────┐
    │ Products  │    │ Products  │   │ Products  │
    │ Instance 1│    │ Instance 2│   │ Instance 3│
    └─────┬─────┘    └─────┬─────┘   └─────┬─────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                    ┌──────▼───────┐
                    │  PostgreSQL  │
                    │ Read Replicas│
                    └──────────────┘
```

### Database Scaling

```
┌─────────────────────────────────────────────────┐
│              Database Sharding                   │
│                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐│
│  │  Shard 1   │  │  Shard 2   │  │  Shard 3   ││
│  │ IDs 0-999  │  │IDs 1K-1999 │  │IDs 2K-2999 ││
│  └────────────┘  └────────────┘  └────────────┘│
└─────────────────────────────────────────────────┘
```

## Seguridad

### Capas de Seguridad Implementadas

1. **API Key Authentication**
   - Header `X-API-Key` requerido
   - Validación en middleware

2. **Helmet.js**
   - Protección contra ataques comunes
   - Headers de seguridad HTTP

3. **CORS**
   - Control de origen cruzado
   - Configurable por ambiente

4. **Input Validation**
   - Validación en capa de aplicación
   - Validación en capa de dominio
   - Prevención de inyección SQL (ORM)

### Mejoras de Seguridad Propuestas

- JWT para autenticación de usuarios
- OAuth 2.0 para autorización
- Rate limiting por IP/cliente
- Encriptación de datos sensibles
- Secrets management (Vault, AWS Secrets Manager)
- TLS/SSL en todas las comunicaciones

## Observabilidad

### Logging Actual
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "message": "HTTP Request",
  "service": "products-service",
  "method": "GET",
  "path": "/api/v1/products/123",
  "statusCode": 200,
  "duration": "45ms"
}
```

### Stack de Observabilidad Propuesto

```
┌─────────────────────────────────────────────┐
│              Observability Stack             │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Prometheus│  │  Jaeger  │  │   ELK    │  │
│  │ Metrics  │  │ Tracing  │  │ Logging  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │             │         │
│       └─────────────┼─────────────┘         │
│                     │                       │
│              ┌──────▼──────┐                │
│              │   Grafana   │                │
│              │ Dashboards  │                │
│              └─────────────┘                │
└─────────────────────────────────────────────┘
```

## Versionado de API

### Estrategia Actual: URL-based

```
/api/v1/products
/api/v2/products  (futuro)
```

### Ventajas
- Clara y explícita
- Fácil de documentar
- Múltiples versiones simultáneas
- Compatible con cache

### Deprecación
1. Anunciar deprecación con 6 meses de anticipación
2. Agregar header `X-API-Deprecated: true`
3. Documentar migración en changelog
4. Mantener versión antigua por período definido
5. Remover versión antigua después del período