import { createConnection } from 'mysql2/promise'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * e2e 测试库初始化（可重复执行）。
 *
 * 在与生产一致的 SQL 基础上建测试库：把 sql/ 三个脚本的库名统一替换为
 * E2E_DB_NAME（默认 wemove_portal_test），按“基线 → 增量迁移 → seed”顺序执行。
 * init 脚本自带 DROP TABLE，重复执行即为全新快照；迁移非幂等，但每次都从
 * 全新库开始，所以整个流程可重复。
 */
export async function setupTestDatabase(): Promise<string> {
  const dbName = process.env.E2E_DB_NAME || 'wemove_portal_test'
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
    join(sqlDir, 'migrations', 'mvp03_catalog_incremental.sql'),
    join(sqlDir, 'seed', 'seed_catalog_mvp03.sql'),
    join(sqlDir, 'seed', 'seed_identity_demo_accounts.sql')
  ]

  try {
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
