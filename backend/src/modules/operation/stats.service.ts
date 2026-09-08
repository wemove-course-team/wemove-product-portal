import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

export interface OperationOverview {
  productCount: number
  articleCount: number
  userCount: number
  pendingApplications: number
  pendingMessages: number
}

/**
 * 后台概览统计。
 *
   * 统计当前已接入的 product、article、sys_user、dealer_application、contact_message，
 * 通过受控 DataSource 执行只读 COUNT，不跨模块调用 Service。
 *
   * 留言与申请只计入待处理状态，供后台运营人员快速定位工作队列。
 */
@Injectable()
export class StatsService {
  constructor(private readonly dataSource: DataSource) {}

  async getOverview(): Promise<OperationOverview> {
    const [productCount, articleCount, userCount, pendingApplications, pendingMessages] = await Promise.all([
      this.count('product'),
      this.count('article'),
      this.count('sys_user'),
      this.count('dealer_application', "`status` = 'PENDING'"),
      this.count('contact_message', "`status` = 'PENDING'")
    ])

    return { productCount, articleCount, userCount, pendingApplications, pendingMessages }
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
