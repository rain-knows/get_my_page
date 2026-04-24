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

/**
 * 文件服务实现。
 */
@Service
@RequiredArgsConstructor
public class FileServiceImpl implements FileService {

    private static final long MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

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
        String normalizedContentType = validateFile(file);

        String key = storageClient.generateArticleObjectKey(postId, file.getOriginalFilename());
        byte[] content = readFileBytes(file);
        String url = storageClient.upload(key, content, normalizedContentType);

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
     * 返回值/副作用：返回归一化后的 MIME 类型；不满足限制时抛出参数异常。
     */
    private String validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BizException(ErrorCode.BAD_REQUEST, "上传文件不能为空");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BizException(ErrorCode.BAD_REQUEST, "文件大小不能超过 20MB");
        }
        return normalizeContentType(file.getContentType(), file.getOriginalFilename());
    }

    /**
     * 功能：归一化上传文件 MIME，优先使用请求头类型，缺失时按文件后缀推断常见类型并兜底为 octet-stream。
     * 关键参数：contentType 为请求头 MIME；filename 为原始文件名。
     * 返回值/副作用：返回归一化 MIME 字符串；无副作用。
     */
    private String normalizeContentType(String contentType, String filename) {
        String extensionBased = resolveContentTypeByFilename(filename);

        if (contentType != null && !contentType.isBlank()) {
            String normalizedContentType = contentType.toLowerCase();
            if ("image/pjpeg".equals(normalizedContentType)) {
                return "image/jpeg";
            }
            if ("image/x-png".equals(normalizedContentType)) {
                return "image/png";
            }
            if ("application/octet-stream".equals(normalizedContentType)
                    || "binary/octet-stream".equals(normalizedContentType)) {
                return extensionBased != null ? extensionBased : "application/octet-stream";
            }
            return normalizedContentType;
        }

        return extensionBased != null ? extensionBased : "application/octet-stream";
    }

    /**
     * 功能：按文件后缀推断常见 MIME 类型，作为请求头缺失或通用流类型时的兜底。
     * 关键参数：filename 为上传文件原始名称。
     * 返回值/副作用：返回推断的 MIME；无法识别时返回 null。
     */
    private String resolveContentTypeByFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return null;
        }
        String lowerName = filename.toLowerCase();
        if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (lowerName.endsWith(".png")) {
            return "image/png";
        }
        if (lowerName.endsWith(".webp")) {
            return "image/webp";
        }
        if (lowerName.endsWith(".gif")) {
            return "image/gif";
        }
        if (lowerName.endsWith(".avif")) {
            return "image/avif";
        }
        if (lowerName.endsWith(".heic")) {
            return "image/heic";
        }
        if (lowerName.endsWith(".heif")) {
            return "image/heif";
        }
        if (lowerName.endsWith(".pdf")) {
            return "application/pdf";
        }
        if (lowerName.endsWith(".txt")) {
            return "text/plain";
        }
        if (lowerName.endsWith(".md")) {
            return "text/markdown";
        }
        if (lowerName.endsWith(".json")) {
            return "application/json";
        }
        if (lowerName.endsWith(".csv")) {
            return "text/csv";
        }
        if (lowerName.endsWith(".doc")) {
            return "application/msword";
        }
        if (lowerName.endsWith(".docx")) {
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }
        if (lowerName.endsWith(".xls")) {
            return "application/vnd.ms-excel";
        }
        if (lowerName.endsWith(".xlsx")) {
            return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        }
        if (lowerName.endsWith(".ppt")) {
            return "application/vnd.ms-powerpoint";
        }
        if (lowerName.endsWith(".pptx")) {
            return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        }
        if (lowerName.endsWith(".zip")) {
            return "application/zip";
        }
        if (lowerName.endsWith(".rar")) {
            return "application/vnd.rar";
        }
        if (lowerName.endsWith(".7z")) {
            return "application/x-7z-compressed";
        }
        if (lowerName.endsWith(".mp3")) {
            return "audio/mpeg";
        }
        if (lowerName.endsWith(".wav")) {
            return "audio/wav";
        }
        if (lowerName.endsWith(".ogg")) {
            return "audio/ogg";
        }
        if (lowerName.endsWith(".mp4")) {
            return "video/mp4";
        }
        if (lowerName.endsWith(".webm")) {
            return "video/webm";
        }
        if (lowerName.endsWith(".mov")) {
            return "video/quicktime";
        }
        return null;
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
