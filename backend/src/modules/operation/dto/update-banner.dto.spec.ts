import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { UpdateBannerDto } from './update-banner.dto'

describe('UpdateBannerDto（单元）', () => {
  it('携带 isActive 校验失败：启停只能走 PUT /admin/banners/:id/status', async () => {
    const dto = plainToInstance(UpdateBannerDto, { title: 'x', isActive: false })
    const errors = await validate(dto)

    expect(errors.map((e) => e.property)).toContain('isActive')
  })

  it('合法部分更新字段通过校验', async () => {
    const dto = plainToInstance(UpdateBannerDto, { title: 'x', sortOrder: 3, linkUrl: null })
    const errors = await validate(dto)

    expect(errors).toHaveLength(0)
  })
})
