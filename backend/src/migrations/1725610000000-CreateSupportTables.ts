import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSupportTables1725610000000 implements MigrationInterface {
    name = 'CreateSupportTables1725610000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      CREATE TABLE \`support_messages\` (
        \`id\` varchar(36) NOT NULL,
        \`ticketNo\` varchar(32) NOT NULL,
        \`name\` varchar(100) NOT NULL,
        \`email\` varchar(255) NOT NULL,
        \`subject\` varchar(255) NOT NULL,
        \`content\` text NOT NULL,
        \`status\` enum('pending', 'processed') NOT NULL DEFAULT 'pending',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_support_messages_ticketNo\` (\`ticketNo\`),
        INDEX \`IDX_support_messages_email\` (\`email\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB;
    `);

        await queryRunner.query(`
      CREATE TABLE \`support_faqs\` (
        \`id\` varchar(36) NOT NULL,
        \`category\` varchar(50) NOT NULL,
        \`question\` varchar(255) NOT NULL,
        \`answer\` text NOT NULL,
        \`sortOrder\` int NOT NULL DEFAULT 0,
        \`isPublished\` boolean NOT NULL DEFAULT true,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX \`IDX_support_faqs_category\` (\`category\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB;
    `);

        await queryRunner.query(`
      CREATE TABLE \`support_manuals\` (
        \`id\` varchar(36) NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`description\` text NULL,
        \`fileUrl\` varchar(500) NOT NULL,
        \`fileSize\` int NOT NULL COMMENT 'File size in bytes',
        \`accessLevel\` enum('public', 'registered') NOT NULL DEFAULT 'public',
        \`isPublished\` boolean NOT NULL DEFAULT true,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB;
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`support_manuals\``);
        await queryRunner.query(`DROP TABLE \`support_faqs\``);
        await queryRunner.query(`DROP TABLE \`support_messages\``);
    }
}