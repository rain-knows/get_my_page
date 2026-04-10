import { SearchWorkbenchPage } from "@/features/search/SearchWorkbenchPage";

/**
 * 功能：作为搜索页路由入口，仅负责拼装搜索工作台业务组件。
 * 关键参数：无外部参数。
 * 返回值/副作用：返回搜索页节点，无副作用。
 */
export default function BlogSearchPage() {
  return <SearchWorkbenchPage />;
}
