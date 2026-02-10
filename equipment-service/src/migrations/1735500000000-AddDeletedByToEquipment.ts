import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDeletedByToEquipment1735500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'equipment',
      new TableColumn({
        name: 'deleted_by',
        type: 'uuid',
        isNullable: true,
        comment: 'User who soft-deleted the equipment (NULL if not deleted)',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('equipment', 'deleted_by');
  }
}
