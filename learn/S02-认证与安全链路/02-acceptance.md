# S02-认证与安全链路 / 02-acceptance

## 5 分钟验收

## 命令
```bash
# 成功路径
curl -sS -X POST http://localhost:8080/api/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin123"}'

# 失败路径
curl -sS -X POST http://localhost:8080/api/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"wrong"}'

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
