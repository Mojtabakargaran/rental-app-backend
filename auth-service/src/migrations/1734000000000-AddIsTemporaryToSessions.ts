import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsTemporaryToSessions1734000000000 implements MigrationInterface {
  name = 'AddIsTemporaryToSessions1734000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'sessions',
      new TableColumn({
        name: 'is_temporary',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('sessions', 'is_temporary');
  }
}
