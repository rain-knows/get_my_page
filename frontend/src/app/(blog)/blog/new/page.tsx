import { BlogArticleEditor } from "@/features/post/components/BlogArticleEditor";

/**
 * 功能：渲染 `/blog/new` 新建文章路由，管理员无需提供已有 slug 即可进入编辑。
 * 关键参数：无。
 * 返回值/副作用：返回新建文章编辑器节点，无额外副作用。
 */
export default function BlogNewPage() {
    return <BlogArticleEditor mode="create" slug={null} />;
}
