import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ContentService } from './content.service'
import { ContentController } from './content.controller'
import { AdminContentController } from './admin-content.controller'
import { Article } from './entities/article.entity'
import { ArticleCategory } from './entities/article-category.entity'
import { Page } from './entities/page.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Article, ArticleCategory, Page])],
  controllers: [ContentController, AdminContentController],
  providers: [ContentService],
  exports: [ContentService]
})
export class ContentModule {}
