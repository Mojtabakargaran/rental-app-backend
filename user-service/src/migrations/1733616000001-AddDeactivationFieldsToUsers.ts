import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeactivationFieldsToUsers1733616000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users 
        ADD COLUMN deactivated_at TIMESTAMP NULL,
        ADD COLUMN deactivated_by UUID NULL,
        ADD COLUMN reactivated_at TIMESTAMP NULL,
        ADD COLUMN reactivated_by UUID NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_users_deactivated_at ON users(deactivated_at)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_users_deactivated_at`);

    await queryRunner.query(`
      ALTER TABLE users 
        DROP COLUMN reactivated_by,
        DROP COLUMN reactivated_at,
        DROP COLUMN deactivated_by,
        DROP COLUMN deactivated_at
    `);
  }
}
