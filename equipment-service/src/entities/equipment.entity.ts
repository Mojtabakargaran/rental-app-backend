import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { EquipmentCategory } from './equipment-category.entity';

@Entity('equipment')
@Index('idx_equipment_tenant_id', ['tenantId'])
@Index('idx_equipment_category_id', ['categoryId'])
@Index('idx_equipment_status', ['status'], {
  where: 'deleted_at IS NULL',
})
@Index('idx_equipment_serial_number', ['tenantId', 'serialNumber'], {
  where: 'serial_number IS NOT NULL AND deleted_at IS NULL',
})
@Index('idx_equipment_deleted', ['deletedAt'])
@Check(`LENGTH(name) >= 1 AND LENGTH(name) <= 200`)
@Check(`description IS NULL OR LENGTH(description) <= 2000`)
@Check(`manufacturer IS NULL OR LENGTH(manufacturer) <= 100`)
@Check(`model IS NULL OR LENGTH(model) <= 100`)
@Check(`serial_number IS NULL OR LENGTH(serial_number) <= 100`)
@Check(`year_of_manufacture IS NULL OR (year_of_manufacture >= 1900 AND year_of_manufacture <= EXTRACT(YEAR FROM CURRENT_DATE))`)
@Check(`purchase_price IS NULL OR purchase_price >= 0`)
@Check(`purchase_date IS NULL OR purchase_date <= CURRENT_DATE`)
@Check(`status IN ('Available', 'Rented', 'Maintenance', 'Out of Service')`)
export class Equipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: false })
  tenantId: string;

  @Column({ name: 'category_id', type: 'uuid', nullable: false })
  categoryId: string;

  @Column({ type: 'varchar', length: 200, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  manufacturer: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string | null;

  @Column({ name: 'serial_number', type: 'varchar', length: 100, nullable: true })
  serialNumber: string | null;

  @Column({ name: 'year_of_manufacture', type: 'integer', nullable: true })
  yearOfManufacture: number | null;

  @Column({ name: 'purchase_price', type: 'decimal', precision: 15, scale: 2, nullable: true })
  purchasePrice: number | null;

  @Column({ name: 'purchase_date', type: 'date', nullable: true })
  purchaseDate: string | null;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'Available' })
  status: string;

  @Column({ name: 'custom_attributes', type: 'jsonb', nullable: true })
  customAttributes: Array<{ key: string; value: string; unit: string | null }> | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => EquipmentCategory, { nullable: false })
  @JoinColumn({ name: 'category_id' })
  category: EquipmentCategory;
}
