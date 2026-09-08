import { StatsService } from './stats.service'

/** 构造受控只读 DataSource Mock（仅支持 SELECT COUNT）。 */
function createDataSourceMock(counts: Record<string, number>) {
  return {
    query: jest.fn(async (sql: string) => {
      const matched = Object.keys(counts).find((table) => sql.includes(`FROM \`${table}\``))
      return [{ cnt: String(matched ? counts[matched] : 0) }]
    })
  }
}

describe('StatsService（单元）', () => {
  it('getOverview：返回产品、内容、用户、申请和留言的真实 COUNT', async () => {
    const ds = createDataSourceMock({
      product: 5,
      article: 3,
      sys_user: 8,
      dealer_application: 2,
      contact_message: 4
    })
    const service = new StatsService(ds as any)

    const overview = await service.getOverview()

    expect(overview).toEqual({
      productCount: 5,
      articleCount: 3,
      userCount: 8,
      pendingApplications: 2,
      pendingMessages: 4
    })
    // 只读查询：不得包含写语句
    for (const call of (ds.query as jest.Mock).mock.calls) {
      expect(String(call[0]).toUpperCase()).not.toMatch(/\b(INSERT|UPDATE|DELETE|DROP|ALTER)\b/)
    }
  })

  it('getOverview：申请和留言只统计 PENDING 状态', async () => {
    const ds = createDataSourceMock({ product: 1, article: 1, sys_user: 1, dealer_application: 0, contact_message: 0 })
    const service = new StatsService(ds as any)

    await service.getOverview()

    expect(ds.query).toHaveBeenCalledWith(expect.stringContaining("FROM `dealer_application` WHERE `status` = 'PENDING'"))
    expect(ds.query).toHaveBeenCalledWith(expect.stringContaining("FROM `contact_message` WHERE `status` = 'PENDING'"))
  })
})
