import { BlogArticleReader } from "@/features/post/components/BlogArticleReader";

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * 功能：渲染 `/blog/[slug]` 文章详情路由并将动态 slug 传递给阅读组件。
 * 关键参数：params 为 Next.js 动态路由参数 Promise，包含文章 slug。
 * 返回值/副作用：返回文章详情页面节点，无额外副作用。
 */
export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;

  return <BlogArticleReader slug={slug} />;
}
