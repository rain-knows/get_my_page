package com.getmypage.blog.infrastructure.storage;

import com.getmypage.blog.exception.BizException;
import com.getmypage.blog.exception.ErrorCode;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.ByteArrayInputStream;

/**
 * 对象存储基础设施封装。
 */
@Component
public class StorageClient {

    private final MinioClient minioClient;
    private final String bucket;
    private final String endpoint;

    /**
     * 功能：初始化对象存储客户端并注入 MinIO 关键配置。
     * 关键参数：minioClient 为 S3 兼容客户端；bucket 为默认桶名；endpoint 为访问域名。
     * 返回值/副作用：无返回值；构造后用于文件上传与 URL 生成。
     */
    public StorageClient(
            MinioClient minioClient,
            @Value("${blog.minio.bucket:blog-assets}") String bucket,
            @Value("${blog.minio.endpoint:http://localhost:9000}") String endpoint) {
        this.minioClient = minioClient;
        this.bucket = bucket;
        this.endpoint = endpoint;
    }

    /**
     * 功能：上传二进制内容到 MinIO 并返回可访问地址。
     * 关键参数：objectName 为对象路径；content 为文件字节；contentType 为文件 MIME 类型。
     * 返回值/副作用：返回上传后访问 URL；副作用为可能创建桶并写入对象。
     */
    public String upload(String objectName, byte[] content, String contentType) {
        if (!StringUtils.hasText(objectName)) {
            throw new BizException(ErrorCode.BAD_REQUEST, "objectName 不能为空");
        }
        if (content == null || content.length == 0) {
            throw new BizException(ErrorCode.BAD_REQUEST, "上传内容不能为空");
        }

        String normalizedContentType = StringUtils.hasText(contentType) ? contentType : "application/octet-stream";
        ensureBucketExists();

        try (ByteArrayInputStream inputStream = new ByteArrayInputStream(content)) {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectName)
                    .stream(inputStream, content.length, -1)
                    .contentType(normalizedContentType)
                    .build());
            return buildObjectUrl(objectName);
        } catch (Exception ex) {
            throw new BizException(ErrorCode.EXTERNAL_SERVICE_ERROR, "上传文件到对象存储失败");
        }
    }

    /**
     * 功能：确保目标桶存在，若不存在则自动创建。
     * 关键参数：无（使用实例内的 bucket 配置）。
     * 返回值/副作用：无返回值；副作用为在桶不存在时创建桶。
     */
    private void ensureBucketExists() {
        try {
            boolean bucketExists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (!bucketExists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            }
        } catch (Exception ex) {
            throw new BizException(ErrorCode.EXTERNAL_SERVICE_ERROR, "初始化对象存储桶失败");
        }
    }

    /**
     * 功能：拼接对象公开访问 URL。
     * 关键参数：objectName 为对象路径。
     * 返回值/副作用：返回完整 URL；无其他副作用。
     */
    private String buildObjectUrl(String objectName) {
        return "%s/%s/%s".formatted(endpoint, bucket, objectName);
    }
}
