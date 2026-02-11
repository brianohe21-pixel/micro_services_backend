import { Entity, PrimaryColumn, Column, UpdateDateColumn, Index } from 'typeorm';

@Entity('inventory')
export class InventoryEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'product_id', unique: true })
  @Index()
  productId!: string;

  @Column({ type: 'integer', default: 0 })
  quantity!: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
