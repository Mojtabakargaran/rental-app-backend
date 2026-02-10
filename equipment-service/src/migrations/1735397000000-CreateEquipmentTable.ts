import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateEquipmentTable1735397000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'equipment',
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
            name: 'category_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '2000',
            isNullable: true,
          },
          {
            name: 'manufacturer',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'model',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'serial_number',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'year_of_manufacture',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'purchase_price',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'purchase_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            isNullable: false,
            default: "'Available'",
          },
          {
            name: 'custom_attributes',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        checks: [
          {
            name: 'chk_equipment_name_length',
            expression: 'LENGTH(name) >= 1 AND LENGTH(name) <= 200',
          },
          {
            name: 'chk_equipment_description_length',
            expression: 'description IS NULL OR LENGTH(description) <= 2000',
          },
          {
            name: 'chk_equipment_manufacturer_length',
            expression: 'manufacturer IS NULL OR LENGTH(manufacturer) <= 100',
          },
          {
            name: 'chk_equipment_model_length',
            expression: 'model IS NULL OR LENGTH(model) <= 100',
          },
          {
            name: 'chk_equipment_serial_number_length',
            expression: 'serial_number IS NULL OR LENGTH(serial_number) <= 100',
          },
          {
            name: 'chk_equipment_year_range',
            expression: 'year_of_manufacture IS NULL OR (year_of_manufacture >= 1900 AND year_of_manufacture <= EXTRACT(YEAR FROM CURRENT_DATE))',
          },
          {
            name: 'chk_equipment_price_positive',
            expression: 'purchase_price IS NULL OR purchase_price >= 0',
          },
          {
            name: 'chk_equipment_purchase_date_past',
            expression: 'purchase_date IS NULL OR purchase_date <= CURRENT_DATE',
          },
          {
            name: 'chk_equipment_status_valid',
            expression: "status IN ('Available', 'Rented', 'Maintenance', 'Out of Service')",
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'equipment',
      new TableIndex({
        name: 'idx_equipment_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'equipment',
      new TableIndex({
        name: 'idx_equipment_category_id',
        columnNames: ['category_id'],
      }),
    );

    await queryRunner.createIndex(
      'equipment',
      new TableIndex({
        name: 'idx_equipment_status',
        columnNames: ['status'],
        where: 'deleted_at IS NULL',
      }),
    );

    await queryRunner.createIndex(
      'equipment',
      new TableIndex({
        name: 'idx_equipment_serial_number',
        columnNames: ['tenant_id', 'serial_number'],
        isUnique: true,
        where: 'serial_number IS NOT NULL AND deleted_at IS NULL',
      }),
    );

    await queryRunner.createIndex(
      'equipment',
      new TableIndex({
        name: 'idx_equipment_deleted',
        columnNames: ['deleted_at'],
      }),
    );

    await queryRunner.query(
      'CREATE INDEX idx_equipment_custom_attributes ON equipment USING GIN (custom_attributes)',
    );

    await queryRunner.createForeignKey(
      'equipment',
      new TableForeignKey({
        name: 'fk_equipment_category',
        columnNames: ['category_id'],
        referencedTableName: 'equipment_categories',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('equipment', 'fk_equipment_category');
    await queryRunner.dropIndex('equipment', 'idx_equipment_custom_attributes');
    await queryRunner.dropIndex('equipment', 'idx_equipment_deleted');
    await queryRunner.dropIndex('equipment', 'idx_equipment_serial_number');
    await queryRunner.dropIndex('equipment', 'idx_equipment_status');
    await queryRunner.dropIndex('equipment', 'idx_equipment_category_id');
    await queryRunner.dropIndex('equipment', 'idx_equipment_tenant_id');
    await queryRunner.dropTable('equipment');
  }
}
