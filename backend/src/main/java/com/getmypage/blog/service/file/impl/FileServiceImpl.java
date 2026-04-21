package com.getmypage.blog.service.file.impl;

import com.getmypage.blog.common.util.SecurityUtils;
import com.getmypage.blog.exception.BizException;
import com.getmypage.blog.exception.ErrorCode;
import com.getmypage.blog.infrastructure.storage.StorageClient;
import com.getmypage.blog.model.dto.response.FileUploadResponse;
import com.getmypage.blog.service.file.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

/**
 * 文件服务实现。
 */
@Service
@RequiredArgsConstructor
public class FileServiceImpl implements FileService {

    private static final long MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );

    private final StorageClient storageClient;
    private final SecurityUtils securityUtils;

    /**
     * 功能：执行文章资源上传并返回对象 key 与可访问 URL。
     * 关键参数：file 为上传文件；postId 为文章 ID。
     * 返回值/副作用：返回上传响应；副作用为写入对象存储。
     */
    @Override
    public FileUploadResponse uploadArticleAsset(MultipartFile file, Long postId) {
        ensureAuthenticatedUser();
        validateFile(file);

        String key = storageClient.generateArticleObjectKey(postId, file.getOriginalFilename());
        byte[] content = readFileBytes(file);
        String url = storageClient.upload(key, content, file.getContentType());

        return FileUploadResponse.builder()
                .key(key)
                .url(url)
                .build();
    }

    /**
     * 功能：校验上传者具备已登录用户身份（USER 或 ADMIN）。
     * 关键参数：无。
     * 返回值/副作用：无返回值；未登录或角色不匹配时抛出无权限异常。
     */
    private void ensureAuthenticatedUser() {
        if (!securityUtils.isAuthenticated()) {
            throw new BizException(ErrorCode.FORBIDDEN, "无权限访问");
        }
        if (!(securityUtils.hasRole("ROLE_USER") || securityUtils.hasRole("ROLE_ADMIN"))) {
            throw new BizException(ErrorCode.FORBIDDEN, "无权限访问");
        }
    }

    /**
     * 功能：校验上传文件是否满足大小与 MIME 类型限制。
     * 关键参数：file 为待校验上传文件。
     * 返回值/副作用：无返回值；不满足限制时抛出参数异常。
     */
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BizException(ErrorCode.BAD_REQUEST, "上传文件不能为空");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BizException(ErrorCode.BAD_REQUEST, "文件大小不能超过 8MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new BizException(ErrorCode.BAD_REQUEST, "不支持的文件类型");
        }
    }

    /**
     * 功能：读取 MultipartFile 字节内容并统一转换异常语义。
     * 关键参数：file 为上传文件。
     * 返回值/副作用：返回文件字节数组；读取失败时抛出业务异常。
     */
    private byte[] readFileBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (Exception ex) {
            throw new BizException(ErrorCode.EXTERNAL_SERVICE_ERROR, "读取上传文件失败");
        }
    }
}
