import { BlogArticleEditor } from "@/features/post/components/BlogArticleEditor";

interface BlogEditPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * 功能：渲染 `/blog/[slug]/edit` 文章独立编辑路由并传递 slug 参数。
 * 关键参数：params 为 Next.js 动态路由参数 Promise，包含文章 slug。
 * 返回值/副作用：返回编辑页面节点，无额外副作用。
 */
export default async function BlogEditPage({ params }: BlogEditPageProps) {
  const { slug } = await params;

  return <BlogArticleEditor slug={slug} />;
}
