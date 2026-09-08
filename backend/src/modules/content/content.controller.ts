import { Controller, Get, Param, Query } from '@nestjs/common'
import { ContentService } from './content.service'
import { ArticleQueryDto } from './dto/article-query.dto'

@Controller()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  /** GET /api/v1/pages/:slug */
  @Get('pages/:slug')
  getPage(@Param('slug') slug: string) {
    return this.contentService.findPageBySlug(slug)
  }

  /** GET /api/v1/articles?page&pageSize&categoryId&keyword */
  @Get('articles')
  getArticles(@Query() query: ArticleQueryDto) {
    return this.contentService.findArticles(query)
  }

  /** GET /api/v1/articles/:slug */
  @Get('articles/:slug')
  getArticle(@Param('slug') slug: string) {
    return this.contentService.findArticleBySlug(slug)
  }

  /** GET /api/v1/article-categories */
  @Get('article-categories')
  getCategories() {
    return this.contentService.findAllCategories()
  }
}
