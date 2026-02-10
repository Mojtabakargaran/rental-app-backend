import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUpdatedByToEquipmentCategories1735300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'equipment_categories',
      new TableColumn({
        name: 'updated_by',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.query(
      `COMMENT ON COLUMN equipment_categories.updated_by IS 'User who last updated the category'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('equipment_categories', 'updated_by');
  }
}
