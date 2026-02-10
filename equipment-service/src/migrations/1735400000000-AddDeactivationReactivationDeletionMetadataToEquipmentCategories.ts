import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDeactivationReactivationDeletionMetadataToEquipmentCategories1735400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'equipment_categories',
      new TableColumn({
        name: 'deactivated_by',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'equipment_categories',
      new TableColumn({
        name: 'deactivated_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'equipment_categories',
      new TableColumn({
        name: 'deactivation_reason',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'equipment_categories',
      new TableColumn({
        name: 'reactivated_by',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'equipment_categories',
      new TableColumn({
        name: 'reactivated_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'equipment_categories',
      new TableColumn({
        name: 'deleted_by',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.query(
      `COMMENT ON COLUMN equipment_categories.deactivated_by IS 'User who deactivated the category'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN equipment_categories.deactivated_at IS 'Timestamp when category was deactivated'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN equipment_categories.deactivation_reason IS 'Reason for category deactivation'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN equipment_categories.reactivated_by IS 'User who reactivated the category'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN equipment_categories.reactivated_at IS 'Timestamp when category was reactivated'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN equipment_categories.deleted_by IS 'User who deleted the category'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('equipment_categories', 'deleted_by');
    await queryRunner.dropColumn('equipment_categories', 'reactivated_at');
    await queryRunner.dropColumn('equipment_categories', 'reactivated_by');
    await queryRunner.dropColumn('equipment_categories', 'deactivation_reason');
    await queryRunner.dropColumn('equipment_categories', 'deactivated_at');
    await queryRunner.dropColumn('equipment_categories', 'deactivated_by');
  }
}
