import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateEquipmentCategoriesTable1703376000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'equipment_categories',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'parent_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'level',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            isNullable: false,
            default: true,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'equipment_categories',
      new TableIndex({
        name: 'idx_equipment_categories_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'equipment_categories',
      new TableIndex({
        name: 'idx_equipment_categories_parent_id',
        columnNames: ['parent_id'],
      }),
    );

    await queryRunner.createIndex(
      'equipment_categories',
      new TableIndex({
        name: 'idx_equipment_categories_tenant_name',
        columnNames: ['tenant_id', 'name'],
      }),
    );

    await queryRunner.createIndex(
      'equipment_categories',
      new TableIndex({
        name: 'idx_equipment_categories_active',
        columnNames: ['is_active'],
        where: 'deleted_at IS NULL',
      }),
    );

    await queryRunner.createIndex(
      'equipment_categories',
      new TableIndex({
        name: 'idx_equipment_categories_deleted',
        columnNames: ['deleted_at'],
      }),
    );

    await queryRunner.createForeignKey(
      'equipment_categories',
      new TableForeignKey({
        name: 'fk_equipment_categories_parent',
        columnNames: ['parent_id'],
        referencedTableName: 'equipment_categories',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
      }),
    );

    // Create partial unique index for tenant_id + name (only for non-deleted records)
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_equipment_categories_tenant_name
      ON equipment_categories (tenant_id, name)
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE equipment_categories
      ADD CONSTRAINT chk_equipment_categories_level
      CHECK (level BETWEEN 1 AND 3)
    `);

    await queryRunner.query(`
      ALTER TABLE equipment_categories
      ADD CONSTRAINT chk_equipment_categories_name_pattern
      CHECK (name ~ '^[A-Za-z0-9 _-]+$')
    `);

    await queryRunner.query(`
      ALTER TABLE equipment_categories
      ADD CONSTRAINT chk_equipment_categories_name_length
      CHECK (LENGTH(name) >= 2 AND LENGTH(name) <= 100)
    `);

    await queryRunner.query(`
      ALTER TABLE equipment_categories
      ADD CONSTRAINT chk_equipment_categories_description_length
      CHECK (description IS NULL OR LENGTH(description) <= 500)
    `);

    await queryRunner.query(`
      ALTER TABLE equipment_categories
      ADD CONSTRAINT chk_equipment_categories_no_self_reference
      CHECK (parent_id IS NULL OR parent_id != id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('equipment_categories');
  }
}
