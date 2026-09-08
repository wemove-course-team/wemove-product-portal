export interface ArticleListItemDto {
  id: string
  title: string
  slug: string
  categoryName: string | null
  coverImage: string | null
  summary: string | null
  publishedAt: Date | null
}
