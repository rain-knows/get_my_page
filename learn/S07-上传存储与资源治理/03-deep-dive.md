# S07-上传存储与资源治理 / 03-deep-dive

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
- 上传功能本质是外部系统集成，失败与超时是常态。
- 资源 URL 是长期契约，命名规则一旦混乱后期迁移成本高。
- 文件校验应在入口尽早进行，减少无效 I/O 消耗。

## 源码阅读点
- 阅读 backend/infrastructure/storage/StorageClient.java。
- 阅读 MinIO Java SDK 上传 API 与异常类型。
- 阅读 frontend/features/upload/index.ts，规划 feature 接入点。

## 常见坑
- 直接信任客户端 Content-Type，导致伪装文件上传。
- 文件 key 无命名规范，后期无法治理历史资源。
- 上传成功但 DB 写入失败，出现悬挂文件。
