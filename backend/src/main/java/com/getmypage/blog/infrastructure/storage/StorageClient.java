package com.getmypage.blog.infrastructure.storage;

import org.springframework.stereotype.Component;

/**
 * 对象存储基础设施封装。
 */
@Component
public class StorageClient {

    public String upload(String objectName, byte[] content, String contentType) {
        // TODO: 接入 MinIO 上传能力。
        return objectName;
    }
}
