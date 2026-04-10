import { RegisterForm } from "@/features/auth/components/RegisterForm";

/**
 * 功能：作为注册页路由入口，仅负责拼装注册业务组件。
 * 关键参数：无外部参数。
 * 返回值/副作用：返回注册路由节点，无副作用。
 */
export default function RegisterPage() {
  return <RegisterForm />;
}
