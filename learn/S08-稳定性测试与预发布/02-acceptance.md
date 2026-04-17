# S08-稳定性测试与预发布 / 02-acceptance

## 5 分钟验收

## 命令
```bash
# 成功路径
docker compose config

# 失败路径
curl -sS http://localhost:8080/api/posts/not-exists-slug

# 构建或测试
npm --prefix frontend run build
```

## 通过标准
- [ ] 成功路径返回符合预期。
- [ ] 失败路径返回明确错误。
- [ ] 构建或测试命令成功退出。

## 记录
- 命令输出摘要：待填写
- 结论：待填写
- 下一步：待填写
