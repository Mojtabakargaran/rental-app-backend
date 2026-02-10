import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSessionsTable1730678400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create sessions table
    await queryRunner.createTable(
      new Table({
        name: 'sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'token_hash',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: false,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'last_activity_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'invalidated_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'invalidation_reason',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create index on user_id
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_user_id',
        columnNames: ['user_id'],
      }),
    );

    // Create index on expires_at
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_expires_at',
        columnNames: ['expires_at'],
      }),
    );

    // Create index on last_activity_at
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_last_activity_at',
        columnNames: ['last_activity_at'],
      }),
    );

    // Create composite index (user_id, is_active, created_at)
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_user_active_created',
        columnNames: ['user_id', 'is_active', 'created_at'],
      }),
    );

    // Create composite index (token_hash, is_active)
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_token_active',
        columnNames: ['token_hash', 'is_active'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('sessions', 'IDX_sessions_token_active');
    await queryRunner.dropIndex('sessions', 'IDX_sessions_user_active_created');
    await queryRunner.dropIndex('sessions', 'IDX_sessions_last_activity_at');
    await queryRunner.dropIndex('sessions', 'IDX_sessions_expires_at');
    await queryRunner.dropIndex('sessions', 'IDX_sessions_user_id');

    // Drop table
    await queryRunner.dropTable('sessions');
  }
}
