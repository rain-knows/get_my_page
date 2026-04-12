# S04-文章写入与管理链路 / 02-acceptance

## 学习目标
- 通过命令级验证，确认本 Step 不是看起来完成，而是可重复完成。

## 完成定义（DoD）
- [ ] 至少 1 条构建或测试命令通过
- [ ] 至少 1 条成功路径接口命令通过
- [ ] 至少 1 条失败路径接口命令通过

## 执行命令
- curl -sS -X POST http://localhost:8080/api/posts -H "Content-Type: application/json" -H "Authorization: Bearer <ADMIN_TOKEN>" -d "{...}"
- curl -sS -X POST http://localhost:8080/api/posts -H "Content-Type: application/json" -d "{...}"
- ./backend/mvnw -f backend/pom.xml test（如当前 Step 涉及后端改动）
- npm --prefix frontend run build（如当前 Step 涉及前端改动）

## 验收结果
| 项目 | 命令 | 期望 | 实际 | 是否通过 |
|---|---|---|---|---|
| 成功路径 | curl -sS -X POST http://localhost:8080/api/posts -H "Content-Type: application/json" -H "Authorization: Bearer <ADMIN_TOKEN>" -d "{...}" | 返回 code=200 或可预期成功结构 | 待填写 | 待填写 |
| 失败路径 | curl -sS -X POST http://localhost:8080/api/posts -H "Content-Type: application/json" -d "{...}" | 返回明确错误码或失败状态 | 待填写 | 待填写 |
| 构建/测试 | ./backend/mvnw -f backend/pom.xml test / npm --prefix frontend run build | 命令成功退出 | 待填写 | 待填写 |

## 架构决策记录（ADR-Style）
- 决策：每个 Step 强制成功+失败+构建三段式验收。
- 背景：只验证成功路径会掩盖多数线上问题。
- 备选方案：仅跑 happy path。
- 取舍原因：三段式能最小化回归风险。
- 影响面：执行时间增加，但质量显著提升。

## 下一步
- 验收通过后，把关键输出归档到 evidence/ 并更新复盘。
