# S06-搜索索引与查询链路 / 03-deep-dive

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
- 搜索系统是读优化系统，不应替代主数据源。
- 索引一致性是工程问题：可接受短暂延迟，但必须可追踪与可修复。
- 高亮字段属于展示层数据，不能反向污染主存储。

## 源码阅读点
- 阅读 backend/infrastructure/search/SearchClient.java。
- 阅读 Meilisearch 文档中的 index settings 与 typo tolerance。
- 阅读 frontend/features/search/SearchWorkbenchPage.tsx 交互结构。

## 常见坑
- 仅更新数据库不更新索引，导致搜索结果陈旧。
- 直接渲染高亮 HTML，不做安全处理。
- 索引失败静默吞掉，长期产生脏索引。
