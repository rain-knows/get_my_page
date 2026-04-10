/**
 * 功能：渲染博客列表页面骨架，作为后续接入真实文章流的数据落点。
 * 关键参数：无外部参数。
 * 返回值/副作用：返回博客列表页基础节点，无副作用。
 */
export default function BlogPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-20">
      <h1 className="text-3xl font-bold text-white">博客</h1>
      <p className="mt-3 text-neutral-400">文章列表页面骨架，后续接入真实数据。</p>
    </main>
  );
}
