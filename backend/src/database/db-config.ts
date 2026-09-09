import * as path from 'path'

export type DatabaseConfig = {
  /** 是否使用 SQLite（本地无 MySQL 时的开发/演示降级） */
  useSqlite: boolean
  /** SQLite 文件路径；MySQL 模式下为空 */
  database: string
  /** 是否允许写入含公开演示账号的种子数据 */
  allowDemoSeed: boolean
}

/**
 * 解析数据库配置。
 *
 * 关键约束（评审 P1）：SQLite 只是本地开发/演示降级方案，种子数据里带公开密码的
 * admin / dealer_demo 账号。生产环境（NODE_ENV=production）缺少 MySQL 配置时必须
 * 直接失败退出，绝不能静默降级并带着演示管理员账号对外提供服务。
 */
export function resolveDatabaseConfig(env: NodeJS.ProcessEnv = process.env): DatabaseConfig {
  const isProduction = env.NODE_ENV === 'production'
  const explicitSqlite = env.DB_TYPE === 'sqlite'
  const explicitMysql = env.DB_TYPE === 'mysql'
  const hasMysqlHost = Boolean(env.DB_HOST)
  const database = env.DB_DATABASE || path.resolve(process.cwd(), 'wemove.sqlite')

  // 未显式指定时使用 MySQL，只有在完全没有 MySQL 主机信息时才降级到 SQLite。
  const useSqlite = explicitSqlite || (!hasMysqlHost && !explicitMysql)

  if (isProduction && useSqlite) {
    throw new Error(
      '[wemove-backend] 生产环境缺少数据库配置：请显式设置 DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME' +
        '（或 DB_TYPE=mysql）。拒绝以 SQLite + 演示账号启动，避免配置错误时暴露公开管理员账号。'
    )
  }

  return {
    useSqlite,
    database,
    // 演示种子仅用于本地开发，生产环境即便显式指定了 SQLite 也不写入。
    allowDemoSeed: !isProduction
  }
}
