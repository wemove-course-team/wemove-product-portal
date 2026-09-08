import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

export interface OperationOverview {
  productCount: number
  articleCount: number
  userCount: number
  pendingApplications: number
}

/**
 * 后台概览统计。
 *
 * 只统计当前 main 已真实接入的 product、article、sys_user、dealer_application，
 * 通过受控 DataSource 执行只读 COUNT，不跨模块调用 Service。
 *
 * 注意：留言统计（pendingMessages）依赖 Support 模块（PR #103）合入、
 * SupportModule 注册与真实 SQL 迁移，本轮不实现、不对外冻结。
 */
@Injectable()
export class StatsService {
  constructor(private readonly dataSource: DataSource) {}

  async getOverview(): Promise<OperationOverview> {
    const [productCount, articleCount, userCount, pendingApplications] = await Promise.all([
      this.count('product'),
      this.count('article'),
      this.count('sys_user'),
      this.count('dealer_application', "`status` = 'PENDING'")
    ])

    return { productCount, articleCount, userCount, pendingApplications }
  }

  /** 只读 COUNT 查询，表名仅允许内部白名单。 */
  private async count(table: string, where = ''): Promise<number> {
    const whereClause = where ? ` WHERE ${where}` : ''
    const rows: Array<{ cnt: string | number }> = await this.dataSource.query(
      `SELECT COUNT(*) AS cnt FROM \`${table}\`${whereClause}`
    )
    return Number(rows[0]?.cnt ?? 0)
  }
}
