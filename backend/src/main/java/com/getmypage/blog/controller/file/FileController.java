package com.getmypage.blog.controller.file;

import com.getmypage.blog.model.dto.response.ApiResponse;
import com.getmypage.blog.model.dto.response.FileUploadResponse;
import com.getmypage.blog.service.file.FileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * 文件上传控制器。
 */
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Tag(name = "文件模块", description = "上传接口")
public class FileController {

    private final FileService fileService;

    /**
     * 功能：上传文章资源文件并返回 URL 与对象 key。
     * 关键参数：file 为上传文件；postId 为文章 ID（可选，缺省走兼容值 0）。
     * 返回值/副作用：返回上传结果；副作用为写入对象存储。
     */
    @Operation(summary = "上传文件", description = "上传图片到对象存储")
    @PostMapping("/upload")
    public ApiResponse<FileUploadResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "postId", required = false) Long postId) {
        return ApiResponse.success(fileService.uploadArticleAsset(file, postId));
    }
}
