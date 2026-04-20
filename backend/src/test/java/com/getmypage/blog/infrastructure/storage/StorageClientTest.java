package com.getmypage.blog.infrastructure.storage;

import com.getmypage.blog.exception.BizException;
import com.getmypage.blog.exception.ErrorCode;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StorageClientTest {

    @Mock
    private MinioClient minioClient;

    /**
     * 功能：验证上传时会在桶存在场景下直接写入对象并返回完整访问地址。
     * 关键参数：无（测试内部使用固定 objectName/content/contentType）。
     * 返回值/副作用：无返回值；断言返回 URL 正确且执行了 putObject 调用。
     */
    @Test
    void uploadShouldPutObjectAndReturnAccessibleUrl() throws Exception {
        when(minioClient.bucketExists(any(BucketExistsArgs.class))).thenReturn(true);
        StorageClient storageClient = new StorageClient(minioClient, "blog-assets", "http://minio:9000");

        String uploadedUrl = storageClient.upload("2026/cover.png", "hello".getBytes(), "image/png");

        assertEquals("http://minio:9000/blog-assets/2026/cover.png", uploadedUrl);
        verify(minioClient).putObject(any(PutObjectArgs.class));
    }

    /**
     * 功能：验证桶不存在时会先创建桶再执行对象上传。
     * 关键参数：无（测试内部模拟 bucketExists=false）。
     * 返回值/副作用：无返回值；断言调用了 makeBucket 与 putObject。
     */
    @Test
    void uploadShouldCreateBucketWhenBucketMissing() throws Exception {
        when(minioClient.bucketExists(any(BucketExistsArgs.class))).thenReturn(false);
        StorageClient storageClient = new StorageClient(minioClient, "blog-assets", "http://minio:9000");

        storageClient.upload("2026/cover.png", "hello".getBytes(), "image/png");

        verify(minioClient).makeBucket(any(MakeBucketArgs.class));
        verify(minioClient).putObject(any(PutObjectArgs.class));
    }

    /**
     * 功能：验证 MinIO 上传异常会转换为统一业务异常，避免泄露底层细节。
     * 关键参数：无（测试内部模拟 putObject 抛出 RuntimeException）。
     * 返回值/副作用：无返回值；断言抛出 EXTERNAL_SERVICE_ERROR。
     */
    @Test
    void uploadShouldThrowBizExceptionWhenMinioFails() throws Exception {
        when(minioClient.bucketExists(any(BucketExistsArgs.class))).thenReturn(true);
        when(minioClient.putObject(any(PutObjectArgs.class))).thenThrow(new RuntimeException("minio down"));
        StorageClient storageClient = new StorageClient(minioClient, "blog-assets", "http://minio:9000");

        BizException exception = assertThrows(BizException.class,
                () -> storageClient.upload("2026/cover.png", "hello".getBytes(), "image/png"));

        assertEquals(ErrorCode.EXTERNAL_SERVICE_ERROR, exception.getErrorCode());
    }
}
