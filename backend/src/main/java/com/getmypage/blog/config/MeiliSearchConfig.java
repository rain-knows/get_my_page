package com.getmypage.blog.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.web.client.RestTemplate;

/**
 * Meilisearch 客户端配置。
 */
@Configuration
public class MeiliSearchConfig {

    /**
     * 功能：创建带鉴权头的 Meilisearch RestTemplate，统一复用请求配置。
     * 关键参数：builder 为 Spring 提供的 RestTemplate 构建器；host/apiKey 为搜索服务连接参数。
     * 返回值/副作用：返回 RestTemplate 实例；副作用为默认附加 X-Meili-API-Key 请求头。
     */
    @Bean("meiliSearchRestTemplate")
    public RestTemplate meiliSearchRestTemplate(
            RestTemplateBuilder builder,
            @Value("${blog.meilisearch.host:http://localhost:7700}") String host,
            @Value("${blog.meilisearch.api-key:masterKey}") String apiKey) {
        return builder
                .rootUri(host)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, "application/json")
                .defaultHeader("X-Meili-API-Key", apiKey)
                .build();
    }
}
