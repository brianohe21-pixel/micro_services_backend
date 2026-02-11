# Propuestas de Escalabilidad

Este documento detalla estrategias para escalar el sistema a medida que crece la demanda.

## Escalabilidad Actual

### Estado Actual
- 2 microservicios monolíticos
- 1 instancia por servicio
- 1 base de datos por servicio
- Comunicación síncrona HTTP

### Capacidad Estimada
- **Productos**: ~1000 req/s por instancia
- **Inventario**: ~800 req/s por instancia (limitado por llamadas a productos)
- **Base de datos**: ~5000 queries/s

---

## Nivel 1: Escalamiento Horizontal Básico

### Múltiples Instancias

```
                    ┌──────────────────┐
                    │  Load Balancer   │
                    │   (Nginx/HAProxy)│
                    └────────┬─────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
      ┌─────▼─────┐    ┌─────▼─────┐   ┌─────▼─────┐
      │ Products  │    │ Products  │   │ Products  │
      │Instance 1 │    │Instance 2 │   │Instance 3 │
      └─────┬─────┘    └─────┬─────┘   └─────┬─────┘
            │                │                │
            └────────────────┼────────────────┘
                             │
                      ┌──────▼───────┐
                      │  PostgreSQL  │
                      │  Primary DB  │
                      └──────────────┘
```

### Implementación

**Docker Compose con réplicas:**
```yaml
services:
  products-service:
    build: ./products-service
    deploy:
      replicas: 3
    environment:
      - DB_HOST=products-db
```

**Kubernetes Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: products-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: products-service
  template:
    metadata:
      labels:
        app: products-service
    spec:
      containers:
      - name: products-service
        image: products-service:latest
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Beneficios
- Capacidad: 3x (3000 req/s)
- Alta disponibilidad
- Zero-downtime deployments
- Failover automático

### Costo
- 3x instancias de aplicación
- Load balancer
- Complejidad operacional moderada

---

## Nivel 2: Escalamiento de Base de Datos

### Read Replicas

```
┌─────────────┐
│   Primary   │
│  (Write)    │
└──────┬──────┘
       │
       │ Replication
       │
       ├──────────┬──────────┐
       │          │          │
┌──────▼───┐ ┌───▼──────┐ ┌─▼────────┐
│ Replica 1│ │Replica 2 │ │Replica 3 │
│  (Read)  │ │  (Read)  │ │  (Read)  │
└──────────┘ └──────────┘ └──────────┘
```

### Implementación

**PostgreSQL Streaming Replication:**
```yaml
services:
  products-db-primary:
    image: postgres:16-alpine
    environment:
      - POSTGRES_REPLICATION_MODE=master
      - POSTGRES_REPLICATION_USER=replicator
      - POSTGRES_REPLICATION_PASSWORD=repl_password

  products-db-replica-1:
    image: postgres:16-alpine
    environment:
      - POSTGRES_REPLICATION_MODE=slave
      - POSTGRES_MASTER_HOST=products-db-primary
      - POSTGRES_REPLICATION_USER=replicator
      - POSTGRES_REPLICATION_PASSWORD=repl_password
```

**Código con separación read/write:**
```typescript
export class ProductRepository implements IProductRepository {
  private writeConnection: DataSource;
  private readConnections: DataSource[];

  async findById(id: string): Promise<Product | null> {
    // Usar replica para lecturas
    const replica = this.getRandomReadConnection();
    return await replica.getRepository(ProductEntity).findOne({ where: { id } });
  }

  async create(product: Product): Promise<Product> {
    // Usar primary para escrituras
    return await this.writeConnection.getRepository(ProductEntity).save(product);
  }

  private getRandomReadConnection(): DataSource {
    return this.readConnections[
      Math.floor(Math.random() * this.readConnections.length)
    ];
  }
}
```

### Beneficios
- Capacidad de lectura: 4x (20,000 queries/s)
- Distribución de carga
- Backup en caliente
- Mejor rendimiento de consultas

### Consideraciones
- Replication lag (típicamente <100ms)
- Consistencia eventual en lecturas
- Complejidad de configuración

---

## Nivel 3: Caching Distribuido

### Redis Cache Layer

```
┌─────────┐
│ Client  │
└────┬────┘
     │
     ▼
┌─────────────┐
│   Service   │
└──┬──────┬───┘
   │      │
   │      └──────────┐
   │                 │
   ▼                 ▼
┌──────┐      ┌──────────┐
│Redis │      │PostgreSQL│
│Cache │      │          │
└──────┘      └──────────┘
```

### Implementación

**Cache Service:**
```typescript
import Redis from 'ioredis';

export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

**Repository con cache:**
```typescript
export class ProductRepository implements IProductRepository {
  constructor(
    private readonly cache: CacheService,
    private readonly db: DataSource
  ) {}

  async findById(id: string): Promise<Product | null> {
    // Intentar cache primero
    const cached = await this.cache.get<Product>(`product:${id}`);
    if (cached) {
      return cached;
    }

    // Si no está en cache, consultar DB
    const product = await this.db
      .getRepository(ProductEntity)
      .findOne({ where: { id } });

    if (product) {
      // Guardar en cache por 1 hora
      await this.cache.set(`product:${id}`, product, 3600);
    }

    return product;
  }

  async update(id: string, data: Partial<Product>): Promise<Product> {
    const updated = await this.db
      .getRepository(ProductEntity)
      .save({ id, ...data });

    // Invalidar cache
    await this.cache.del(`product:${id}`);
    await this.cache.invalidatePattern('products:list:*');

    return updated;
  }
}
```

### Estrategias de Cache

**1. Cache-Aside (Lazy Loading)**
```typescript
// Leer: Cache → DB → Cache
const product = await cache.get(key) || await db.find(id);
```

**2. Write-Through**
```typescript
// Escribir: DB → Cache
await db.save(product);
await cache.set(key, product);
```

**3. Write-Behind (Write-Back)**
```typescript
// Escribir: Cache → Queue → DB (async)
await cache.set(key, product);
await queue.publish('product.updated', product);
```

### Beneficios
- Reducción de latencia: 10-100x
- Menor carga en BD: 70-90%
- Mejor experiencia de usuario
- Capacidad: 100,000+ req/s

### TTL Recomendados
- Productos: 1 hora (cambian poco)
- Inventario: 5 minutos (cambia frecuentemente)
- Listas: 10 minutos

---

## Nivel 4: Database Sharding

### Sharding por ID

```
┌──────────────────────────────────────┐
│         Shard Router                 │
│   (hash(product_id) % num_shards)    │
└────┬──────────┬──────────┬───────────┘
     │          │          │
     ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Shard 0 │ │ Shard 1 │ │ Shard 2 │
│IDs: 0,3,│ │IDs: 1,4,│ │IDs: 2,5,│
│   6,9...│ │   7,10..│ │   8,11..│
└─────────┘ └─────────┘ └─────────┘
```

### Implementación

**Shard Router:**
```typescript
export class ShardRouter {
  private shards: DataSource[];
  private numShards: number;

  constructor(shards: DataSource[]) {
    this.shards = shards;
    this.numShards = shards.length;
  }

  getShardForId(id: string): DataSource {
    const hash = this.hashId(id);
    const shardIndex = hash % this.numShards;
    return this.shards[shardIndex];
  }

  private hashId(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  async findById(id: string): Promise<Product | null> {
    const shard = this.getShardForId(id);
    return await shard.getRepository(ProductEntity).findOne({ where: { id } });
  }

  async findAll(page: number, limit: number): Promise<Product[]> {
    // Query a todos los shards en paralelo
    const promises = this.shards.map(shard =>
      shard.getRepository(ProductEntity).find({
        skip: (page - 1) * limit,
        take: limit
      })
    );

    const results = await Promise.all(promises);
    return results.flat().slice(0, limit);
  }
}
```

### Estrategias de Sharding

**1. Hash-based Sharding**
- Distribución uniforme
- Difícil rebalancear

**2. Range-based Sharding**
```
Shard 1: IDs 0-999
Shard 2: IDs 1000-1999
Shard 3: IDs 2000-2999
```

**3. Geographic Sharding**
```
Shard US-East: Usuarios de US-East
Shard EU-West: Usuarios de EU-West
Shard AP-South: Usuarios de AP-South
```

### Beneficios
- Capacidad: N x capacidad por shard
- Aislamiento de fallos
- Escalamiento lineal

### Desafíos
- Queries cross-shard complejos
- Rebalanceo de datos
- Transacciones distribuidas

---

## Nivel 5: Comunicación Asíncrona

### Message Broker (RabbitMQ/Kafka)

```
┌──────────┐         ┌───────────┐
│ Products │────────►│  Message  │
│ Service  │ Publish │  Broker   │
└──────────┘         └─────┬─────┘
                           │
                           │ Subscribe
                           │
                     ┌─────▼──────┐
                     │ Inventory  │
                     │  Service   │
                     └────────────┘
```

### Implementación con RabbitMQ

**Publisher (Products Service):**
```typescript
import amqp from 'amqplib';

export class EventPublisher {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async connect() {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL);
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange('products', 'topic', { durable: true });
  }

  async publishProductCreated(product: Product) {
    const message = {
      event: 'product.created',
      data: product,
      timestamp: new Date().toISOString()
    };

    this.channel.publish(
      'products',
      'product.created',
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  }

  async publishProductDeleted(productId: string) {
    const message = {
      event: 'product.deleted',
      data: { productId },
      timestamp: new Date().toISOString()
    };

    this.channel.publish(
      'products',
      'product.deleted',
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  }
}
```

**Consumer (Inventory Service):**
```typescript
export class EventConsumer {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async connect() {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL);
    this.channel = await this.connection.createChannel();
    
    await this.channel.assertExchange('products', 'topic', { durable: true });
    const queue = await this.channel.assertQueue('inventory-products-events', {
      durable: true
    });

    await this.channel.bindQueue(queue.queue, 'products', 'product.*');
    
    this.channel.consume(queue.queue, async (msg) => {
      if (msg) {
        const event = JSON.parse(msg.content.toString());
        await this.handleEvent(event);
        this.channel.ack(msg);
      }
    });
  }

  private async handleEvent(event: any) {
    switch (event.event) {
      case 'product.created':
        // Crear inventario automáticamente
        await this.createInventory(event.data.id);
        break;
      case 'product.deleted':
        // Eliminar inventario
        await this.deleteInventory(event.data.productId);
        break;
    }
  }
}
```

### Beneficios
- Desacoplamiento temporal
- Mejor resiliencia
- Procesamiento asíncrono
- Event sourcing posible

---

## Nivel 6: CQRS (Command Query Responsibility Segregation)

### Arquitectura CQRS

```
┌─────────┐
│ Client  │
└────┬────┘
     │
     ├──────────────┬──────────────┐
     │              │              │
     ▼              ▼              ▼
┌─────────┐   ┌─────────┐   ┌─────────┐
│ Command │   │  Query  │   │  Event  │
│   API   │   │   API   │   │  Store  │
└────┬────┘   └────┬────┘   └────┬────┘
     │              │              │
     ▼              ▼              ▼
┌─────────┐   ┌─────────┐   ┌─────────┐
│ Write   │   │  Read   │   │ Event   │
│  DB     │   │  DB     │   │   DB    │
│(Postgres│   │(MongoDB)│   │         │
└─────────┘   └─────────┘   └─────────┘
```

### Implementación

**Command Side:**
```typescript
export class CreateProductCommand {
  constructor(
    private readonly eventStore: EventStore,
    private readonly writeDb: DataSource
  ) {}

  async execute(dto: CreateProductDTO): Promise<string> {
    const productId = uuidv4();
    
    // Guardar en write DB
    await this.writeDb.getRepository(ProductEntity).save({
      id: productId,
      ...dto
    });

    // Publicar evento
    await this.eventStore.append({
      aggregateId: productId,
      type: 'ProductCreated',
      data: dto,
      timestamp: new Date()
    });

    return productId;
  }
}
```

**Query Side:**
```typescript
export class ProductQueryService {
  constructor(private readonly readDb: MongoDB) {}

  async findById(id: string): Promise<ProductReadModel | null> {
    // Leer de read DB optimizada
    return await this.readDb.collection('products').findOne({ _id: id });
  }

  async search(criteria: SearchCriteria): Promise<ProductReadModel[]> {
    // Queries complejas optimizadas
    return await this.readDb.collection('products').find({
      $text: { $search: criteria.query },
      price: { $gte: criteria.minPrice, $lte: criteria.maxPrice }
    }).toArray();
  }
}
```

**Event Projector:**
```typescript
export class ProductProjector {
  async onProductCreated(event: ProductCreatedEvent) {
    await this.readDb.collection('products').insertOne({
      _id: event.aggregateId,
      ...event.data,
      createdAt: event.timestamp
    });
  }

  async onProductUpdated(event: ProductUpdatedEvent) {
    await this.readDb.collection('products').updateOne(
      { _id: event.aggregateId },
      { $set: event.data }
    );
  }
}
```

### Beneficios
- Optimización independiente de lecturas/escrituras
- Escalado diferenciado
- Múltiples modelos de lectura
- Auditoría completa

---

## Nivel 7: API Gateway

### Arquitectura con Gateway

```
┌─────────┐
│ Client  │
└────┬────┘
     │
     ▼
┌────────────────┐
│  API Gateway   │
│  - Auth        │
│  - Rate Limit  │
│  - Routing     │
│  - Aggregation │
└────┬───────────┘
     │
     ├──────────┬──────────┬──────────┐
     │          │          │          │
     ▼          ▼          ▼          ▼
┌─────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Products │ │Inventory│ │ Users │ │Orders │
└─────────┘ └────────┘ └────────┘ └────────┘
```

### Implementación con Kong

**docker-compose.yml:**
```yaml
services:
  kong:
    image: kong:latest
    environment:
      - KONG_DATABASE=postgres
      - KONG_PG_HOST=kong-db
    ports:
      - "8000:8000"  # Proxy
      - "8001:8001"  # Admin API

  kong-db:
    image: postgres:16-alpine
```

**Configuración:**
```bash
# Agregar servicio
curl -i -X POST http://localhost:8001/services \
  --data name=products \
  --data url=http://products-service:3001

# Agregar ruta
curl -i -X POST http://localhost:8001/services/products/routes \
  --data paths[]=/products

# Agregar rate limiting
curl -i -X POST http://localhost:8001/services/products/plugins \
  --data name=rate-limiting \
  --data config.minute=100

# Agregar autenticación
curl -i -X POST http://localhost:8001/services/products/plugins \
  --data name=key-auth
```

### Beneficios
- Punto de entrada único
- Autenticación centralizada
- Rate limiting global
- Agregación de respuestas
- Transformación de requests/responses

---

## Nivel 8: Service Mesh (Istio)

### Arquitectura con Service Mesh

```
┌──────────────────────────────────────────┐
│           Service Mesh (Istio)           │
│                                          │
│  ┌────────┐    ┌────────┐    ┌────────┐│
│  │ Envoy  │    │ Envoy  │    │ Envoy  ││
│  │ Proxy  │    │ Proxy  │    │ Proxy  │││
│  └───┬────┘    └───┬────┘    └───┬────┘│
│      │             │             │      │
│  ┌───▼────┐    ┌───▼────┐    ┌───▼────┐│
│  │Products│    │Inventory│    │ Users  ││
│  └────────┘    └────────┘    └────────┘│
└──────────────────────────────────────────┘
```

### Configuración Istio

**VirtualService:**
```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: products
spec:
  hosts:
  - products-service
  http:
  - match:
    - headers:
        x-api-version:
          exact: "v2"
    route:
    - destination:
        host: products-service
        subset: v2
  - route:
    - destination:
        host: products-service
        subset: v1
```

**DestinationRule (Circuit Breaker):**
```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: products
spec:
  host: products-service
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        http2MaxRequests: 100
    outlierDetection:
      consecutiveErrors: 5
      interval: 30s
      baseEjectionTime: 30s
```

### Beneficios
- Traffic management avanzado
- Observabilidad automática
- Seguridad mTLS
- Circuit breaker nativo
- Canary deployments

---

## Comparación de Niveles

| Nivel | Capacidad | Complejidad | Costo | Tiempo Impl. |
|-------|-----------|-------------|-------|--------------|
| 1. Horizontal Scaling | 3x | Baja | Bajo | 1 semana |
| 2. Read Replicas | 4x | Media | Medio | 2 semanas |
| 3. Caching | 10-100x | Media | Bajo | 2 semanas |
| 4. Sharding | Nx | Alta | Alto | 1-2 meses |
| 5. Async Messaging | N/A | Media | Medio | 3-4 semanas |
| 6. CQRS | 10x+ | Alta | Alto | 2-3 meses |
| 7. API Gateway | N/A | Media | Medio | 2-3 semanas |
| 8. Service Mesh | N/A | Alta | Alto | 1-2 meses |

---

## Roadmap Recomendado

### Fase 1 (0-3 meses)
1. Horizontal scaling (3 instancias)
2. Redis caching
3. Monitoring básico

### Fase 2 (3-6 meses)
1. Read replicas
2. API Gateway (Kong)
3. Message broker (RabbitMQ)

### Fase 3 (6-12 meses)
1. Database sharding
2. CQRS básico
3. Service mesh (Istio)

### Fase 4 (12+ meses)
1. Event sourcing completo
2. Multi-region deployment
3. Edge computing