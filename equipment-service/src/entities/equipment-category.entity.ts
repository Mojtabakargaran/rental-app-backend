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
} from 'typeorm';

@Entity('equipment_categories')
@Index('idx_equipment_categories_tenant_id', ['tenantId'])
@Index('idx_equipment_categories_parent_id', ['parentId'])
@Index('idx_equipment_categories_tenant_name', ['tenantId', 'name'])
@Index('idx_equipment_categories_active', ['isActive'], {
  where: 'deleted_at IS NULL',
})
@Index('idx_equipment_categories_deleted', ['deletedAt'])
export class EquipmentCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: false })
  tenantId: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ type: 'integer', nullable: false })
  level: number;

  @Column({ name: 'is_active', type: 'boolean', nullable: false, default: true })
  isActive: boolean;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;

  @Column({ name: 'deactivated_by', type: 'uuid', nullable: true })
  deactivatedBy: string | null;

  @Column({ name: 'deactivated_at', type: 'timestamp', nullable: true })
  deactivatedAt: Date | null;

  @Column({ name: 'deactivation_reason', type: 'varchar', length: 500, nullable: true })
  deactivationReason: string | null;

  @Column({ name: 'reactivated_by', type: 'uuid', nullable: true })
  reactivatedBy: string | null;

  @Column({ name: 'reactivated_at', type: 'timestamp', nullable: true })
  reactivatedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => EquipmentCategory, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: EquipmentCategory | null;
}
