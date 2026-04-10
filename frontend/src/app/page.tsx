import { HomePageExperience } from "@/features/home";

/**
 * 功能：作为首页路由入口，仅负责拼装首页体验组件。
 * 关键参数：无外部参数。
 * 返回值/副作用：返回首页入口节点，无副作用。
 */
export default function Home() {
  return <HomePageExperience />;
}
