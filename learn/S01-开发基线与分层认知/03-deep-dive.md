# S01-开发基线与分层认知 / 03-deep-dive

## 学习目标
- 掌握本 Step 背后的设计原理与实现约束，不停留在 API 表面。

## 完成定义（DoD）
- [ ] 完成至少 3 条原理剖析
- [ ] 完成至少 3 条源码阅读记录
- [ ] 输出至少 3 条常见坑与规避策略

## 执行命令
- rg -n "class|interface|@Service|@RestController" backend/src/main/java
- rg -n "export function|useState|useSWR" frontend/src

## 验收结果
- 原理笔记：待填写
- 源码阅读结论：待填写
- 关键风险项：待填写

## 架构决策记录（ADR-Style）
- 决策：深挖为何这样设计，而非只记录做了什么。
- 背景：避免重复踩坑与局部最优。
- 备选方案：仅记录操作步骤。
- 取舍原因：原理导向更可迁移。
- 影响面：学习成本稍高，但长期收益更大。

## 下一步
- 将深挖结论反哺到任务板与架构笔记。

## 原理剖析
- 分层不是目录美化，而是控制变更影响半径：请求协议变化不应牵连 UI 原子组件。
- 先契约后实现：以 docs 契约为锚点，把每次开发限制为一个最小闭环。
- 对齐运行环境：容器网络地址与浏览器地址不同，SSR 与 CSR 的后端访问路径不同。

## 源码阅读点
- 阅读 docs/architecture-contract.md，写出 5 条最容易违规的规则。
- 阅读 backend/controller/auth/AuthController.java，识别控制器层边界是否清晰。
- 阅读 frontend/features/search/SearchWorkbenchPage.tsx，标注哪些内容属于占位。

## 常见坑
- 把业务请求直接写在 app/page.tsx，导致页面不可复用。
- 在 components/ui 放业务组件，后续改样式牵一发而动全身。
- 启动后不做健康检查，误把端口可访问当成系统可用。
