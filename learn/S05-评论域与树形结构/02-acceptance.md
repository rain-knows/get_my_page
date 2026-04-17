# S05-评论域与树形结构 / 02-acceptance

## 5 分钟验收

## 命令
```bash
# 成功路径
curl -sS -X POST http://localhost:8080/api/comments -H 'Content-Type: application/json' -d '{"targetType":"post","targetId":1,"content":"hello","guestNickname":"guest","guestEmail":"guest@example.com"}'

# 失败路径
curl -sS -X DELETE http://localhost:8080/api/comments/1

# 构建或测试
./backend/mvnw -f backend/pom.xml test
```

## 通过标准
- [ ] 成功路径返回符合预期。
- [ ] 失败路径返回明确错误。
- [ ] 构建或测试命令成功退出。

## 记录
- 命令输出摘要：待填写
- 结论：待填写
- 下一步：待填写
