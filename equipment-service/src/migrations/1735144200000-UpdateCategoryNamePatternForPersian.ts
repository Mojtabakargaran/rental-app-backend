import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCategoryNamePatternForPersian1735144200000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the old constraint
    await queryRunner.query(`
      ALTER TABLE equipment_categories
      DROP CONSTRAINT IF EXISTS chk_equipment_categories_name_pattern
    `);

    // Add new constraint that supports Persian/Arabic characters
    // Unicode ranges: \u0600-\u06FF (Arabic), \u0750-\u077F (Arabic Supplement)
    await queryRunner.query(`
      ALTER TABLE equipment_categories
      ADD CONSTRAINT chk_equipment_categories_name_pattern
      CHECK (name ~ '^[A-Za-z0-9\u0600-\u06FF\u0750-\u077F _-]+$')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to the old constraint
    await queryRunner.query(`
      ALTER TABLE equipment_categories
      DROP CONSTRAINT IF EXISTS chk_equipment_categories_name_pattern
    `);

    await queryRunner.query(`
      ALTER TABLE equipment_categories
      ADD CONSTRAINT chk_equipment_categories_name_pattern
      CHECK (name ~ '^[A-Za-z0-9 _-]+$')
    `);
  }
}
