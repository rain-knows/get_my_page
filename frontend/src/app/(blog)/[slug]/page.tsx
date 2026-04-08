interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-20">
      <h1 className="text-3xl font-bold text-white">文章详情</h1>
      <p className="mt-3 text-neutral-400">当前文章: {slug}</p>
    </main>
  );
}
