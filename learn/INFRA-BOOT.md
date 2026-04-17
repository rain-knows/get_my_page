# INFRA-BOOT（基础设施前置轨）

## 目标
在进入文章链路前，先把 Redis、MinIO、Meilisearch 做到“最小可用”，避免后续返工。

## 为什么先做
- Redis：认证登出黑名单、后续缓存失效都依赖它。
- MinIO：封面图与富文本资源上传依赖它。
- Meilisearch：搜索页与索引更新依赖它。

## 最小完成定义（DoD）
- [ ] Redis 可连通，具备 set/get 与 TTL 能力。
- [ ] MinIO 可上传并返回可访问 URL。
- [ ] Meilisearch 可创建索引并完成一条文档写入与查询。
- [ ] 后端基础设施类不再是 TODO 占位。

## 5 分钟验收命令
```bash
curl -sS http://localhost:7700/health
curl -sS http://localhost:9000/minio/health/live
# Redis 如未暴露端口，使用容器内命令验证
# docker compose exec redis redis-cli ping
```

## 推荐开发顺序
1. Redis（先完成认证黑名单闭环）。
2. MinIO（为文章写入和封面上传铺路）。
3. Meilisearch（先实现最小索引写入与查询）。

## 失败时的最小兜底
- 组件不可用时，不阻塞业务接口进度：先提供明确错误码和日志。
- 保持接口契约不变，后续替换实现时不影响前端联调。
