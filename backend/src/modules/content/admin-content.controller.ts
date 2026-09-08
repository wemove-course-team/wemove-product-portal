import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards
} from '@nestjs/common'
import { SessionGuard } from '../../common/session.guard'
import { RolesGuard, Roles } from '../../common/roles.guard'
import { ContentService } from './content.service'
import { CreateArticleDto } from './dto/create-article.dto'
import { UpdateArticleDto, UpdateArticleStatusDto } from './dto/update-article.dto'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import { UpdatePageDto } from './dto/update-page.dto'
import { AdminArticleQueryDto } from './dto/article-query.dto'

@Controller('admin')
@UseGuards(SessionGuard, RolesGuard)
@Roles('ADMIN')
export class AdminContentController {
  constructor(private readonly contentService: ContentService) {}

  // ============================== 文章管理 ==============================

  @Get('articles')
  listArticles(@Query() query: AdminArticleQueryDto) {
    return this.contentService.adminFindArticles(query)
  }

  @Get('articles/:id')
  getArticle(@Param('id') id: string) {
    return this.contentService.adminFindArticleById(id)
  }

  @Post('articles')
  createArticle(@Body() dto: CreateArticleDto) {
    return this.contentService.adminCreateArticle(dto)
  }

  @Put('articles/:id')
  updateArticle(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
    return this.contentService.adminUpdateArticle(id, dto)
  }

  @Put('articles/:id/status')
  updateArticleStatus(@Param('id') id: string, @Body() dto: UpdateArticleStatusDto) {
    return this.contentService.adminUpdateArticleStatus(id, dto.status)
  }

  @Delete('articles/:id')
  async deleteArticle(@Param('id') id: string) {
    await this.contentService.adminDeleteArticle(id)
    return { success: true }
  }

  // ============================== 分类管理 ==============================

  @Get('article-categories')
  listCategories() {
    return this.contentService.findAllCategories()
  }

  @Get('article-categories/:id')
  getCategory(@Param('id') id: string) {
    return this.contentService.adminFindCategoryById(id)
  }

  @Post('article-categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.contentService.adminCreateCategory(dto)
  }

  @Put('article-categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.contentService.adminUpdateCategory(id, dto)
  }

  @Delete('article-categories/:id')
  async deleteCategory(@Param('id') id: string) {
    await this.contentService.adminDeleteCategory(id)
    return { success: true }
  }

  // ============================== 栏目页面管理 ==============================

  @Get('pages')
  listPages() {
    return this.contentService.adminFindAllPages()
  }

  @Get('pages/:id')
  getPage(@Param('id') id: string) {
    return this.contentService.adminFindPageById(id)
  }

  @Put('pages/:id')
  updatePage(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    return this.contentService.adminUpdatePage(id, dto)
  }
}
