import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogs1729468800000 implements MigrationInterface {
  name = 'CreateAuditLogs1729468800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create audit_logs table
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "correlation_id" uuid NOT NULL,
        "event_id" uuid,
        "action" character varying(100) NOT NULL,
        "user_id" uuid,
        "tenant_id" uuid,
        "email" character varying(255),
        "ip_address" character varying(45),
        "user_agent" text,
        "metadata" jsonb,
        "error_code" character varying(100),
        "error_message" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_correlation_id" ON "audit_logs" ("correlation_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_action" ON "audit_logs" ("action")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_user_id" ON "audit_logs" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_tenant_id" ON "audit_logs" ("tenant_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_created_at" ON "audit_logs" ("created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_tenant_action_created" 
      ON "audit_logs" ("tenant_id", "action", "created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_tenant_action_created"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_tenant_id"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_action"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_correlation_id"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "audit_logs"`);
  }
}
