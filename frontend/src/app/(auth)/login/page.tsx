import { LoginForm } from "@/features/auth/components/LoginForm";

/**
 * 功能：作为登录页路由入口，仅负责拼装登录业务组件。
 * 关键参数：无外部参数。
 * 返回值/副作用：返回登录路由节点，无副作用。
 */
export default function LoginPage() {
  return <LoginForm />;
}
