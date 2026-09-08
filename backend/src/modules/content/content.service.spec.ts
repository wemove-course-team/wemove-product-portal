import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'
import { ContentService } from './content.service'
import { sanitizeHtml, sanitizeDeep } from './utils/html-sanitizer'
import type { Article } from './entities/article.entity'
import type { ArticleCategory } from './entities/article-category.entity'
import type { Page } from './entities/page.entity'

describe('ContentService (unit)', () => {
  let service: ContentService
  let mockArticleRepo: any
  let mockCategoryRepo: any
  let mockPageRepo: any

  const sampleCategory: ArticleCategory = {
    id: '1',
    name: '公司动态',
    slug: 'company-news',
    sortOrder: 1,
    articles: []
  }

  const sampleArticle: Article = {
    id: '10',
    title: '测试文章',
    slug: 'test-article',
    categoryId: '1',
    coverImage: '/images/cover.jpg',
    summary: '文章摘要',
    content: '正文内容',
    status: 'PUBLISHED',
    publishedAt: new Date('2026-09-01'),
    createdAt: new Date('2026-09-01'),
    updatedAt: new Date('2026-09-01'),
    category: sampleCategory
  }

  const samplePage: Page = {
    id: '1',
    slug: 'furniture',
    title: '原木家具',
    sectionsJson: JSON.stringify([{ type: 'Cover', title: 'Banner' }]),
    status: 'PUBLISHED',
    updatedAt: new Date('2026-09-01')
  }

  beforeEach(() => {
    mockArticleRepo = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      find: jest.fn(),
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn(async (entity) => ({ id: '10', ...entity })),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      count: jest.fn().mockResolvedValue(0)
    }

    mockCategoryRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn(async (entity) => ({ id: '1', ...entity })),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      delete: jest.fn().mockResolvedValue({ affected: 1 })
    }

    mockPageRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 })
    }

    service = new ContentService(mockArticleRepo, mockCategoryRepo, mockPageRepo)
  })

  describe('公开接口', () => {
    it('findPageBySlug: 成功返回已发布页面并解析 sectionsJson', async () => {
      mockPageRepo.findOne.mockResolvedValue(samplePage)

      const result = await service.findPageBySlug('furniture')
      expect(result.slug).toBe('furniture')
      expect(result.title).toBe('原木家具')
      expect(result.sections).toHaveLength(1)
      expect(result.sections[0].type).toBe('Cover')
    })

    it('findPageBySlug: 页面不存在或未发布时抛出 NotFoundException', async () => {
      mockPageRepo.findOne.mockResolvedValue(null)

      await expect(service.findPageBySlug('unknown')).rejects.toThrow(NotFoundException)
    })

    it('findPageBySlug: sectionsJson 损坏时安全降级为空数组', async () => {
      mockPageRepo.findOne.mockResolvedValue({ ...samplePage, sectionsJson: '{invalid json' })

      const result = await service.findPageBySlug('furniture')
      expect(result.sections).toEqual([])
    })

    it('findArticles: 仅返回已发布文章并正确映射 DTO', async () => {
      mockArticleRepo.findAndCount.mockResolvedValue([[sampleArticle], 1])

      const result = await service.findArticles({ page: 1, pageSize: 10 })
      expect(result.total).toBe(1)
      expect(result.items[0]).toEqual({
        id: '10',
        title: '测试文章',
        slug: 'test-article',
        categoryName: '公司动态',
        coverImage: '/images/cover.jpg',
        summary: '文章摘要',
        publishedAt: sampleArticle.publishedAt
      })
      expect(mockArticleRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PUBLISHED' })
        })
      )
    })

    it('findArticles: 分页尺寸上限收敛为 50', async () => {
      mockArticleRepo.findAndCount.mockResolvedValue([[], 0])

      const result = await service.findArticles({ page: 1, pageSize: 200 })
      expect(result.pageSize).toBe(50)
      expect(mockArticleRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 })
      )
    })

    it('findArticleBySlug: 成功返回已发布文章', async () => {
      mockArticleRepo.findOne.mockResolvedValue(sampleArticle)

      const result = await service.findArticleBySlug('test-article')
      expect(result.slug).toBe('test-article')
      expect(result.title).toBe('测试文章')
    })

    it('findArticleBySlug: 未发布或不存在抛出 NotFoundException', async () => {
      mockArticleRepo.findOne.mockResolvedValue(null)

      await expect(service.findArticleBySlug('draft-article')).rejects.toThrow(NotFoundException)
    })

    it('findAllCategories: 按 sortOrder 升序排列', async () => {
      mockCategoryRepo.find.mockResolvedValue([sampleCategory])

      const result = await service.findAllCategories()
      expect(result).toHaveLength(1)
      expect(mockCategoryRepo.find).toHaveBeenCalledWith({ order: { sortOrder: 'ASC' } })
    })
  })

  describe('管理接口 - 文章管理', () => {
    it('adminCreateArticle: 成功创建文章并清洗 HTML 正文', async () => {
      mockArticleRepo.findOne.mockResolvedValue(null)

      const dto = {
        title: '新文章',
        slug: 'new-article',
        content: '<script>alert("xss")</script><p>正常段落</p>',
        status: 'PUBLISHED' as const
      }

      await service.adminCreateArticle(dto)
      expect(mockArticleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '新文章',
          slug: 'new-article',
          content: expect.not.stringContaining('<script>'),
          publishedAt: expect.any(Date)
        })
      )
      expect(mockArticleRepo.save).toHaveBeenCalled()
    })

    it('adminCreateArticle: 重复 slug 抛出 ConflictException', async () => {
      mockArticleRepo.findOne.mockResolvedValue(sampleArticle)

      await expect(
        service.adminCreateArticle({
          title: '重复 slug 文章',
          slug: 'test-article'
        })
      ).rejects.toThrow(ConflictException)
    })

    it('adminCreateArticle: categoryId 不存在抛出 BadRequestException', async () => {
      mockArticleRepo.findOne.mockResolvedValue(null)
      mockCategoryRepo.findOne.mockResolvedValue(null)

      await expect(
        service.adminCreateArticle({
          title: '分类不存在文章',
          slug: 'non-existent-category-article',
          categoryId: '99999'
        })
      ).rejects.toThrow(BadRequestException)
    })

    it('adminUpdateArticle: 从草稿切换为发布时自动填充 publishedAt', async () => {
      const draftArticle = { ...sampleArticle, status: 'DRAFT', publishedAt: null }
      mockArticleRepo.findOne.mockResolvedValue(draftArticle)

      await service.adminUpdateArticle('10', { status: 'PUBLISHED' })
      expect(mockArticleRepo.update).toHaveBeenCalledWith(
        '10',
        expect.objectContaining({
          status: 'PUBLISHED',
          publishedAt: expect.any(Date)
        })
      )
    })

    it('adminUpdateArticle: 更新为不存在的 categoryId 抛出 BadRequestException', async () => {
      mockArticleRepo.findOne.mockResolvedValue(sampleArticle)
      mockCategoryRepo.findOne.mockResolvedValue(null)

      await expect(
        service.adminUpdateArticle('10', { categoryId: '99999' })
      ).rejects.toThrow(BadRequestException)
    })

    it('adminUpdateArticleStatus: 快捷切换状态', async () => {
      mockArticleRepo.findOne.mockResolvedValue(sampleArticle)

      await service.adminUpdateArticleStatus('10', 'OFFLINE')
      expect(mockArticleRepo.update).toHaveBeenCalledWith('10', { status: 'OFFLINE' })
    })

    it('adminDeleteArticle: 成功删除或不存在报错', async () => {
      mockArticleRepo.delete.mockResolvedValue({ affected: 1 })
      await expect(service.adminDeleteArticle('10')).resolves.toBeUndefined()

      mockArticleRepo.delete.mockResolvedValue({ affected: 0 })
      await expect(service.adminDeleteArticle('999')).rejects.toThrow(NotFoundException)
    })
  })

  describe('管理接口 - 分类与页面管理', () => {
    it('adminCreateCategory: slug 冲突抛出 ConflictException', async () => {
      mockCategoryRepo.findOne.mockResolvedValue(sampleCategory)

      await expect(
        service.adminCreateCategory({ name: '冲突', slug: 'company-news' })
      ).rejects.toThrow(ConflictException)
    })

    it('adminDeleteCategory: 有文章引用分类时阻断删除并返回 BadRequestException', async () => {
      mockArticleRepo.count.mockResolvedValue(3)

      await expect(service.adminDeleteCategory('1')).rejects.toThrow(BadRequestException)
      expect(mockCategoryRepo.delete).not.toHaveBeenCalled()
    })

    it('adminUpdatePage: sectionsJson 格式错误时抛出 BadRequestException', async () => {
      mockPageRepo.findOne.mockResolvedValue(samplePage)

      await expect(
        service.adminUpdatePage('1', { sectionsJson: '{ bad json }' })
      ).rejects.toThrow(BadRequestException)
    })

    it('adminUpdatePage: 递归清洗 sectionsJson 中的恶意 onerror 与脚本标签', async () => {
      mockPageRepo.findOne.mockResolvedValue(samplePage)

      const maliciousSections = [
        {
          type: 'TextImage',
          config: {
            title: '测试',
            text: '<img src=x onerror=alert(1)><script>evil()</script>安全内容'
          }
        }
      ]

      await service.adminUpdatePage('1', {
        sectionsJson: JSON.stringify(maliciousSections)
      })

      expect(mockPageRepo.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          sectionsJson: expect.not.stringContaining('onerror')
        })
      )
      expect(mockPageRepo.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          sectionsJson: expect.not.stringContaining('<script>')
        })
      )
    })
  })

  describe('安全防护 - html-sanitizer', () => {
    it('剥离 script/iframe/object 等危险标签并清理伪协议', () => {
      const malicious = '<script>alert(1)</script><p onclick="evil()">文本</p><iframe src="javascript:evil()"></iframe>'
      const sanitized = sanitizeHtml(malicious)

      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('<iframe')
      expect(sanitized).not.toContain('onclick=')
      expect(sanitized).not.toContain('javascript:')
      expect(sanitized).toContain('文本')
    })

    it('剥离 onerror/onload 等内联事件属性，防止图片/SVG 等标签上的事件执行', () => {
      const xss1 = '<img src=x onerror=alert(1)>'
      const xss2 = '<img src="x" onerror="alert(document.cookie)">'
      const xss3 = '<svg onload=alert(1)>'
      const xss4 = '<div onmouseover=alert(1)>hover me</div>'

      expect(sanitizeHtml(xss1)).not.toContain('onerror')
      expect(sanitizeHtml(xss2)).not.toContain('onerror')
      expect(sanitizeHtml(xss3)).not.toContain('onload')
      expect(sanitizeHtml(xss4)).not.toContain('onmouseover')
    })

    it('sanitizeDeep 能够递归清洗嵌套对象与数组中的字符串', () => {
      const complex = {
        title: 'Safe',
        sections: [
          { text: '<img src=x onerror=alert(1)>段落' },
          { subItems: ['<script>xss()</script>条目'] }
        ]
      }
      const cleaned = sanitizeDeep(complex) as any

      expect(cleaned.sections[0].text).not.toContain('onerror')
      expect(cleaned.sections[0].text).toContain('段落')
      expect(cleaned.sections[1].subItems[0]).not.toContain('<script>')
      expect(cleaned.sections[1].subItems[0]).toContain('条目')
    })
  })
})
