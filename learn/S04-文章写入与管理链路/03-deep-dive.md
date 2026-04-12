# S04-文章写入与管理链路 / 03-deep-dive

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
- 写路径核心是约束而非存储：先校验再落库。
- 权限控制要靠后端强制，不依赖前端按钮隐藏。
- 事务边界应覆盖主实体与关联表，避免半成功状态。

## 源码阅读点
- 阅读 backend/security/SecurityConfig.java。
- 阅读 backend/resources/db/migration/V1__Initial_Schema.sql 的文章相关表约束。
- 阅读 frontend/app/admin/posts/page.tsx 当前骨架，规划 feature 化改造。

## 常见坑
- 先写主表后写关联表但无事务，异常时产生脏数据。
- 只在前端限制管理员操作，后端未鉴权。
- 更新接口全量覆盖字段导致误清空。
