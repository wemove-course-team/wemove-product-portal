import { createConnection } from 'mysql2/promise'
import { readFileSync } from 'fs'
import { join } from 'path'

/** 重建独立 e2e 数据库，并按基线、迁移、seed 顺序初始化。 */
export async function setupTestDatabase(): Promise<string> {
  const dbName = process.env.E2E_DB_NAME || 'wemove_portal_test'
  if (!/^\w+_test$/.test(dbName) || dbName === 'wemove_portal') {
    throw new Error('E2E_DB_NAME 必须是以 _test 结尾的独立测试库，禁止使用正式库')
  }

  const connection = await createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'wemove123',
    multipleStatements: true,
    charset: 'utf8mb4'
  })

  const sqlDir = join(__dirname, '..', 'sql')
  const scripts = [
    join(sqlDir, 'init_schema_and_data.sql'),
    join(sqlDir, 'migrations', 'mvp01_identity_password_reset.sql'),
    join(sqlDir, 'migrations', 'mvp03_catalog_incremental.sql'),
    join(sqlDir, 'migrations', 'mvp04_content_tables.sql'),
    join(sqlDir, 'migrations', 'mvp06_dealer_application_user.sql'),
    join(sqlDir, 'migrations', 'mvp07_operation_tables.sql'),
    join(sqlDir, 'seed', 'seed_catalog_mvp03.sql'),
    join(sqlDir, 'seed', 'seed_identity_demo_accounts.sql'),
    join(sqlDir, 'seed', 'seed_content_mvp04.sql'),
    join(sqlDir, 'seed', 'seed_operation_mvp07.sql')
  ]

  try {
    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\`; CREATE DATABASE \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`)
    for (const file of scripts) {
      const raw = readFileSync(file, 'utf-8')
      // 脚本里的库名统一指向测试库，保证与演示库互不影响
      const sql = raw.replaceAll('wemove_portal', dbName)
      await connection.query(sql)
    }
  } finally {
    await connection.end()
  }
  return dbName
}
