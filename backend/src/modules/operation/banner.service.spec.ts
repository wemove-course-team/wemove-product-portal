import { BadRequestException, NotFoundException } from '@nestjs/common'
import { BannerService } from './banner.service'

interface BannerRow {
  id: number
  title: string
  imageUrl: string
  linkUrl: string | null
  sortOrder: number
  isActive: number
  createdAt: Date
  updatedAt: Date
}

/** 构造内存版 Banner 仓库 Mock。 */
function createRepoMock(initial: BannerRow[] = []) {
  let seq = initial.length ? Math.max(...initial.map((b) => b.id)) : 0
  const rows = [...initial]
  const repo = {
    rows,
    find: jest.fn(async (opts: { where?: { isActive?: number } } = {}) => {
      const where = opts.where ?? {}
      const filtered = rows.filter(
        (b) => where.isActive === undefined || Number(b.isActive) === Number(where.isActive)
      )
      return [...filtered].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
    }),
    findOne: jest.fn(async (opts: { where: { id: number } }) =>
      rows.find((b) => b.id === Number(opts.where.id)) ?? null
    ),
    create: jest.fn((data: Partial<BannerRow>) => ({ ...data }) as BannerRow),
    save: jest.fn(async (data: BannerRow) => {
      if (!data.id) {
        seq += 1
        data.id = seq
        data.createdAt = new Date()
        data.updatedAt = new Date()
        rows.push(data)
      } else {
        const idx = rows.findIndex((b) => b.id === data.id)
        rows[idx] = { ...rows[idx], ...data }
      }
      return data
    }),
    // 兼容 repo.update(id, partial) 与 manager.update(target, criteria, partial) 两种签名
    update: jest.fn(async (...args: any[]) => {
      const [id, partial] = args.length >= 3 ? [args[1], args[2]] : [args[0], args[1]]
      const idx = rows.findIndex((b) => b.id === Number(id))
      if (idx >= 0) rows[idx] = { ...rows[idx], ...(partial as Partial<BannerRow>) }
      return { affected: idx >= 0 ? 1 : 0 }
    }),
    delete: jest.fn(async (id: number) => {
      const idx = rows.findIndex((b) => b.id === Number(id))
      if (idx >= 0) rows.splice(idx, 1)
      return { affected: idx >= 0 ? 1 : 0 }
    })
  }
  // 默认事务管理器：回调内经 manager.update 复用同一 update mock。
  ;(repo as any).manager = {
    transaction: jest.fn(async (cb: (manager: unknown) => Promise<void>) => {
      await cb({ update: repo.update })
    })
  }
  return repo
}

function row(over: Partial<BannerRow> = {}): BannerRow {
  return {
    id: 1,
    title: '横幅',
    imageUrl: '/images/prod_20_1.jpg',
    linkUrl: null,
    sortOrder: 0,
    isActive: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over
  }
}

describe('BannerService（单元）', () => {
  it('listPublic：仅返回启用项，按 sortOrder、id 稳定排序', async () => {
    const repo = createRepoMock([
      row({ id: 3, sortOrder: 2 }),
      row({ id: 2, sortOrder: 1, isActive: 0 }),
      row({ id: 5, sortOrder: 1 }),
      row({ id: 1, sortOrder: 1 })
    ])
    const service = new BannerService(repo as any)

    const items = await service.listPublic()

    expect(items.map((b) => b.id)).toEqual([1, 5, 3])
  })

  it('adminList：返回全部（含停用）', async () => {
    const repo = createRepoMock([row({ id: 1, isActive: 0 }), row({ id: 2 })])
    const service = new BannerService(repo as any)

    const items = await service.adminList()

    expect(items).toHaveLength(2)
  })

  it('adminCreate：真实写入仓库并返回完整字段', async () => {
    const repo = createRepoMock()
    const service = new BannerService(repo as any)

    const created = await service.adminCreate({
      title: '新品横幅',
      imageUrl: '/images/prod_14_1.jpg',
      linkUrl: '/products',
      sortOrder: 5,
      isActive: true
    })

    expect(created.title).toBe('新品横幅')
    expect(created.sortOrder).toBe(5)
    expect(repo.rows).toHaveLength(1)
  })

  it('adminCreate：非法 URL 被拒绝（400）', async () => {
    const repo = createRepoMock()
    const service = new BannerService(repo as any)

    await expect(
      service.adminCreate({ title: 'x', imageUrl: 'ftp://bad' })
    ).rejects.toThrow(BadRequestException)
    await expect(
      service.adminCreate({ title: 'x', imageUrl: '/ok.jpg', linkUrl: 'javascript:alert(1)' })
    ).rejects.toThrow(BadRequestException)
  })

  it('adminUpdate：更新不存在 id 返回 404', async () => {
    const repo = createRepoMock()
    const service = new BannerService(repo as any)

    await expect(service.adminUpdate(999, { title: 'x' })).rejects.toThrow(NotFoundException)
  })

  it('adminUpdate：携带 isActive 被拒绝（400），不允许“200 但状态未变”的假成功', async () => {
    const repo = createRepoMock([row({ id: 1 })])
    const service = new BannerService(repo as any)

    await expect(
      service.adminUpdate(1, { title: '新标题', isActive: false } as any)
    ).rejects.toMatchObject({
      status: 400,
      response: expect.objectContaining({
        errors: expect.arrayContaining([expect.objectContaining({ field: 'isActive' })])
      })
    })

    // isActive 未被写入，状态保持启用
    const items = await service.adminList()
    expect(items[0].isActive).toBe(true)
    expect(items[0].title).toBe('横幅')
  })

  it('adminUpdateStatus：启停真实写入', async () => {
    const repo = createRepoMock([row({ id: 1 })])
    const service = new BannerService(repo as any)

    const updated = await service.adminUpdateStatus(1, false)
    expect(updated.isActive).toBe(false)
    expect(await service.listPublic()).toHaveLength(0)
  })

  it('adminSort：批量更新排序，稳定排序生效', async () => {
    const repo = createRepoMock([row({ id: 1 }), row({ id: 2 }), row({ id: 3 })])
    const service = new BannerService(repo as any)

    await service.adminSort([
      { id: 1, sortOrder: 30 },
      { id: 2, sortOrder: 10 },
      { id: 3, sortOrder: 20 }
    ])

    const items = await service.listPublic()
    expect(items.map((b) => b.id)).toEqual([2, 3, 1])
  })

  it('adminSort：包含不存在的 id 返回 404 且不部分提交', async () => {
    const repo = createRepoMock([row({ id: 1 })])
    const service = new BannerService(repo as any)

    await expect(
      service.adminSort([{ id: 1, sortOrder: 5 }, { id: 404, sortOrder: 6 }])
    ).rejects.toThrow(NotFoundException)
    expect((repo as any).update).not.toHaveBeenCalled()
  })

  it('adminSort：重复 id 返回 400 且不进入事务', async () => {
    const repo = createRepoMock([row({ id: 1 }), row({ id: 2 })])
    const service = new BannerService(repo as any)

    await expect(
      service.adminSort([{ id: 1, sortOrder: 5 }, { id: 1, sortOrder: 6 }])
    ).rejects.toThrow(BadRequestException)
    expect((repo as any).manager.transaction).not.toHaveBeenCalled()
  })

  /** 为 repo mock 挂载事务型 manager：回调内经 manager.update 写入，回调抛错则整体回滚。 */
  function attachTransactionManager(
    repo: ReturnType<typeof createRepoMock>,
    managerUpdate: jest.Mock
  ): jest.Mock {
    const transaction = jest.fn(async (cb: (manager: unknown) => Promise<void>) => {
      const snapshot = JSON.stringify(repo.rows)
      try {
        await cb({ update: managerUpdate })
      } catch (err) {
        const restored = JSON.parse(snapshot) as BannerRow[]
        repo.rows.splice(0, repo.rows.length, ...restored)
        throw err
      }
    })
    ;(repo as any).manager = { transaction }
    return transaction
  }

  it('adminSort：事务内更新阶段失败时整体回滚，无部分排序写入', async () => {
    const repo = createRepoMock([row({ id: 1, sortOrder: 0 }), row({ id: 2, sortOrder: 0 })])
    const service = new BannerService(repo as any)
    const managerUpdate = jest.fn(async (_target: unknown, id: unknown, partial: object) => {
      if (Number(id) === 2) throw new Error('mock write failure')
      const idx = repo.rows.findIndex((b) => b.id === Number(id))
      repo.rows[idx] = { ...repo.rows[idx], ...(partial as object) }
      return { affected: 1 }
    })
    attachTransactionManager(repo, managerUpdate)

    await expect(
      service.adminSort([{ id: 1, sortOrder: 9 }, { id: 2, sortOrder: 8 }])
    ).rejects.toThrow('mock write failure')

    // 第 1 条的排序未持久化（整体回滚）
    const items = await service.adminList()
    expect(items.find((b) => b.id === 1)?.sortOrder).toBe(0)
    expect(items.find((b) => b.id === 2)?.sortOrder).toBe(0)
  })

  it('adminSort：事务内并发删除（affected=0）时回滚且无部分写入', async () => {
    const repo = createRepoMock([row({ id: 1, sortOrder: 0 }), row({ id: 2, sortOrder: 0 })])
    const service = new BannerService(repo as any)
    const managerUpdate = jest.fn(async (_target: unknown, id: unknown, partial: object) => {
      if (Number(id) === 2) return { affected: 0 } // 模拟事务执行期间记录被并发删除
      const idx = repo.rows.findIndex((b) => b.id === Number(id))
      repo.rows[idx] = { ...repo.rows[idx], ...(partial as object) }
      return { affected: 1 }
    })
    attachTransactionManager(repo, managerUpdate)

    await expect(
      service.adminSort([{ id: 1, sortOrder: 5 }, { id: 2, sortOrder: 6 }])
    ).rejects.toThrow(NotFoundException)

    const items = await service.adminList()
    expect(items.find((b) => b.id === 1)?.sortOrder).toBe(0)
  })

  it('adminDelete：删除不存在 id 返回 404', async () => {
    const repo = createRepoMock()
    const service = new BannerService(repo as any)

    await expect(service.adminDelete(999)).rejects.toThrow(NotFoundException)
  })
})
