package com.getmypage.blog.service.file;

import com.getmypage.blog.model.dto.response.FileUploadResponse;
import org.springframework.web.multipart.MultipartFile;

/**
 * 文件服务。
 */
public interface FileService {

    /**
     * 功能：上传文章资源文件并返回可访问 URL 与对象 key。
     * 关键参数：file 为上传文件；postId 为文章 ID（缺省时走兼容路径 0）。
     * 返回值/副作用：返回上传结果；副作用为写入对象存储。
     */
    FileUploadResponse uploadArticleAsset(MultipartFile file, Long postId);
}
