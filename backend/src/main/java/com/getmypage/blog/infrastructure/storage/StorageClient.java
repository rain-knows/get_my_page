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
import java.net.URI;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Locale;
import java.util.UUID;

/**
 * 对象存储基础设施封装。
 */
@Component
public class StorageClient {

    private static final ZoneId ARTICLE_OBJECT_ZONE = ZoneId.of("Asia/Shanghai");

    private final MinioClient minioClient;
    private final String bucket;
    private final String endpoint;
    private final String publicEndpoint;

    /**
     * 功能：初始化对象存储客户端并注入 MinIO 关键配置。
     * 关键参数：minioClient 为 S3 兼容客户端；bucket 为默认桶名；endpoint 为内部访问域名；publicEndpoint 为浏览器访问域名。
     * 返回值/副作用：无返回值；构造后用于文件上传与 URL 生成。
     */
    public StorageClient(
            MinioClient minioClient,
            @Value("${blog.minio.bucket:blog-assets}") String bucket,
            @Value("${blog.minio.endpoint:http://localhost:9000}") String endpoint,
            @Value("${MINIO_PUBLIC_ENDPOINT:}") String publicEndpoint) {
        this.minioClient = minioClient;
        this.bucket = bucket;
        this.endpoint = endpoint;
        this.publicEndpoint = publicEndpoint;
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

        String normalizedObjectName = normalizeObjectName(objectName);
        String normalizedContentType = StringUtils.hasText(contentType) ? contentType : "application/octet-stream";
        ensureBucketExists();

        try (ByteArrayInputStream inputStream = new ByteArrayInputStream(content)) {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(normalizedObjectName)
                    .stream(inputStream, content.length, -1)
                    .contentType(normalizedContentType)
                    .build());
            return buildObjectUrl(normalizedObjectName);
        } catch (Exception ex) {
            throw new BizException(ErrorCode.EXTERNAL_SERVICE_ERROR, "上传文件到对象存储失败");
        }
    }

    /**
     * 功能：生成符合文章资源规范的对象 key，格式为 /articles/{yyyy}/{mm}/{dd}/{postId}/{uuid}.{ext}。
     * 关键参数：postId 为文章 ID；originalFilename 为原始文件名用于提取扩展名。
     * 返回值/副作用：返回标准化对象 key；无副作用。
     */
    public String generateArticleObjectKey(Long postId, String originalFilename) {
        long normalizedPostId = (postId == null || postId <= 0) ? 0L : postId;
        LocalDate today = LocalDate.now(ARTICLE_OBJECT_ZONE);
        String extension = extractExtension(originalFilename);
        String uuid = UUID.randomUUID().toString().replace("-", "");
        return "/articles/%d/%02d/%02d/%d/%s.%s".formatted(
                today.getYear(),
                today.getMonthValue(),
                today.getDayOfMonth(),
                normalizedPostId,
                uuid,
                extension
        );
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
        return "%s/%s/%s".formatted(resolvePublicEndpoint(), bucket, objectName);
    }

    /**
     * 功能：解析对象存储对外可访问域名，优先使用显式公网端点，兼容开发环境 minio 服务名映射。
     * 关键参数：无（内部读取 endpoint 与 publicEndpoint 配置）。
     * 返回值/副作用：返回可供浏览器访问的端点；无副作用。
     */
    private String resolvePublicEndpoint() {
        if (StringUtils.hasText(publicEndpoint)) {
            return trimTrailingSlash(publicEndpoint);
        }

        String normalizedEndpoint = trimTrailingSlash(endpoint);
        try {
            URI uri = URI.create(normalizedEndpoint);
            String host = uri.getHost();
            if (!StringUtils.hasText(host)) {
                return normalizedEndpoint;
            }
            if ("minio".equalsIgnoreCase(host) || "blog-minio".equalsIgnoreCase(host)) {
                String scheme = StringUtils.hasText(uri.getScheme()) ? uri.getScheme() : "http";
                int port = uri.getPort() > 0 ? uri.getPort() : 9000;
                return "%s://localhost:%d".formatted(scheme, port);
            }
            return normalizedEndpoint;
        } catch (Exception ignored) {
            return normalizedEndpoint;
        }
    }

    /**
     * 功能：移除 URL 末尾斜杠，避免对象地址拼接时出现重复斜杠。
     * 关键参数：value 为待处理 URL 字符串。
     * 返回值/副作用：返回去尾斜杠后的字符串；无副作用。
     */
    private String trimTrailingSlash(String value) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.endsWith("/")) {
            return normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    /**
     * 功能：标准化对象路径，去除前导斜杠以避免 URL 与 SDK 双斜杠问题。
     * 关键参数：objectName 为原始对象路径。
     * 返回值/副作用：返回标准化后的对象路径；无副作用。
     */
    private String normalizeObjectName(String objectName) {
        return objectName.startsWith("/") ? objectName.substring(1) : objectName;
    }

    /**
     * 功能：从原始文件名提取扩展名，缺失时使用 bin 兜底。
     * 关键参数：originalFilename 为原始文件名。
     * 返回值/副作用：返回小写扩展名；无副作用。
     */
    private String extractExtension(String originalFilename) {
        if (!StringUtils.hasText(originalFilename)) {
            return "bin";
        }
        int lastDot = originalFilename.lastIndexOf('.');
        if (lastDot < 0 || lastDot == originalFilename.length() - 1) {
            return "bin";
        }
        return originalFilename.substring(lastDot + 1).toLowerCase(Locale.ROOT);
    }
}
