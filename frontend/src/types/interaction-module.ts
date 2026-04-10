export type InteractionModuleKey = "scan" | "forge" | "shield";

export interface InteractionModuleMeta {
  key: InteractionModuleKey;
  code: "01" | "02" | "03";
  label: "SCAN" | "FORGE" | "SHIELD";
}

export const INTERACTION_MODULES: readonly InteractionModuleMeta[] = [
  { key: "scan", code: "01", label: "SCAN" },
  { key: "forge", code: "02", label: "FORGE" },
  { key: "shield", code: "03", label: "SHIELD" },
] as const;

/**
 * 功能：按既定顺序循环切换背景交互模式，供单按钮切换场景复用。
 * 关键参数：current 表示当前激活的模式键值。
 * 返回值/副作用：返回下一个模式键值，无副作用。
 */
export function getNextInteractionModule(current: InteractionModuleKey): InteractionModuleKey {
  const order: InteractionModuleKey[] = ["scan", "forge", "shield"];
  const currentIndex = order.indexOf(current);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % order.length;
  return order[nextIndex];
}
