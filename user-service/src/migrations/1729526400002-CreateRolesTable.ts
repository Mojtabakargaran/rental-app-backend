import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateRolesTable1729526400002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create roles table
    await queryRunner.createTable(
      new Table({
        name: 'roles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_system_role',
            type: 'boolean',
            isNullable: false,
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            isNullable: false,
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create index on code
    await queryRunner.createIndex(
      'roles',
      new TableIndex({
        name: 'IDX_roles_code',
        columnNames: ['code'],
      }),
    );

    // Seed initial role data
    await queryRunner.query(`
      INSERT INTO roles (id, code, name, description, is_system_role, created_at, updated_at)
      VALUES 
        (uuid_generate_v4(), 'COMPANY_OWNER', 'Company Owner', 'Owner of the company with full administrative access', true, now(), now()),
        (uuid_generate_v4(), 'MANAGER', 'Manager', 'Manager with elevated permissions', true, now(), now()),
        (uuid_generate_v4(), 'STAFF', 'Staff', 'Standard staff member', true, now(), now()),
        (uuid_generate_v4(), 'MAINTENANCE', 'Maintenance', 'Maintenance personnel', true, now(), now()),
        (uuid_generate_v4(), 'READ_ONLY', 'Read-Only', 'Read-only access to the system', true, now(), now());
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('roles');
  }
}
