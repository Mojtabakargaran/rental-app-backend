import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateVerificationTokensTable1729526400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create verification_tokens table
    await queryRunner.createTable(
      new Table({
        name: 'verification_tokens',
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
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'is_used',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
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
      'verification_tokens',
      new TableIndex({
        name: 'IDX_verification_tokens_user_id',
        columnNames: ['user_id'],
      }),
    );

    // Create index on expires_at for cleanup queries
    await queryRunner.createIndex(
      'verification_tokens',
      new TableIndex({
        name: 'IDX_verification_tokens_expires_at',
        columnNames: ['expires_at'],
      }),
    );

    // Create composite index on (user_id, is_used, expires_at)
    await queryRunner.createIndex(
      'verification_tokens',
      new TableIndex({
        name: 'IDX_verification_tokens_user_id_is_used_expires_at',
        columnNames: ['user_id', 'is_used', 'expires_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('verification_tokens');
  }
}
