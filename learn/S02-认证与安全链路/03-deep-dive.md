# S02-认证与安全链路 / 03-deep-dive

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
- Security 责任拆分：鉴权过滤器负责身份识别，业务层负责业务许可。
- JWT 的无状态是优势也是负担：撤销能力需要黑名单或版本号机制补齐。
- 统一错误码让前端可编排，而不是被动展示字符串。

## 源码阅读点
- 阅读 backend/security/auth/JwtTokenProvider.java，标注生成/校验关键点。
- 阅读 backend/exception/GlobalExceptionHandler.java，确认异常出口一致性。
- 阅读 frontend/stores/use-auth-store.ts，评估 token 存储风险。

## 常见坑
- 仅校验 token 签名，不校验业务态（禁用用户、登出用户）。
- 把 refresh token 当 access token 用，导致权限边界混乱。
- 认证失败返回 500，掩盖真实问题并增加排障成本。
