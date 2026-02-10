import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('sessions')
@Index(['userId', 'isActive', 'createdAt'])
@Index(['tokenHash', 'isActive'])
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ name: 'token_hash', type: 'varchar', length: 255, unique: true })
  tokenHash: string;

  @Column({ name: 'ip_address', type: 'varchar', length: 45 })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text' })
  userAgent: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  @Index()
  expiresAt: Date;

  @Column({ name: 'last_activity_at', type: 'timestamp' })
  @Index()
  lastActivityAt: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_temporary', type: 'boolean', default: false })
  isTemporary: boolean;

  @Column({ name: 'invalidated_at', type: 'timestamp', nullable: true })
  invalidatedAt: Date | null;

  @Column({ name: 'invalidation_reason', type: 'varchar', length: 100, nullable: true })
  invalidationReason: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
