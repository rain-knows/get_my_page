package com.getmypage.blog.config;

import io.minio.MinioClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * MinIO 客户端配置。
 */
@Configuration
public class MinioConfig {

    /**
     * 功能：创建 MinIO 客户端 Bean，供对象存储基础设施统一复用。
     * 关键参数：endpoint 为 MinIO 访问地址；accessKey/secretKey 为访问凭证。
     * 返回值/副作用：返回 MinioClient 实例；无其他副作用。
     */
    @Bean
    public MinioClient minioClient(
            @Value("${blog.minio.endpoint:http://localhost:9000}") String endpoint,
            @Value("${blog.minio.access-key:minioadmin}") String accessKey,
            @Value("${blog.minio.secret-key:minioadmin}") String secretKey) {
        return MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
    }
}
