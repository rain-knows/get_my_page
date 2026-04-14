import { BlogArticleReader } from "@/features/post/components/BlogArticleReader";

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;

  return <BlogArticleReader slug={slug} />;
}
