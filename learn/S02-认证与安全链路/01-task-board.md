# S02-认证与安全链路 / 01-task-board

## 学习目标
- 把本 Step 拆成可执行任务，保证做完即验收。

## 完成定义（DoD）
- [ ] P0 任务全部完成
- [ ] 至少完成 2 条 P1 任务
- [ ] 测试与文档任务都有可追踪产出

## 执行命令
- rg --files backend/src/main/java frontend/src
- rg -n "TODO|FIXME" backend frontend

## 验收结果
- 当前完成率：0%
- 当前阻塞项：无

## 架构决策记录（ADR-Style）
- 决策：优先完成 P0，再推进 P1/P2。
- 背景：避免任务并行导致上下文切换过高。
- 备选方案：全并行推进。
- 取舍原因：当前阶段更需要确定性。
- 影响面：交付节奏更稳定，但探索速度略慢。

## 下一步
- 先完成后端 P0，再联动前端 P0。

## 后端任务
- [ ] P0：核对 AuthServiceImpl 的成功/失败路径与错误码映射。
- [ ] P0：补全登出黑名单 TODO 的技术设计（Redis key、TTL、校验时机）。
- [ ] P1：为 refresh 流程补充过期/伪造 token 行为测试。

## 前端任务
- [ ] P0：验证 features/auth/hooks.ts 对 ApiError 的显示逻辑。
- [ ] P1：补充 token 失效时的前端降级策略（跳转登录页或清空状态）。
- [ ] P2：登录/注册表单增加错误码到文案映射。

## 测试任务
- [ ] P0：成功登录、错误密码、非法参数三条接口测试。
- [ ] P1：refresh token 重放与过期用例。
- [ ] P1：未登录访问 /api/users/me 的行为断言。

## 文档任务
- [ ] P0：在本 Step 记录 token 生命周期图（Access/Refresh）。
- [ ] P1：整理认证错误码对照表给前端消费。
