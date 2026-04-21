package com.getmypage.blog.model.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 更新文章请求。
 */
@Data
@Schema(description = "更新文章请求")
public class PostUpdateRequest {

    @NotBlank(message = "标题不能为空")
    @Schema(description = "文章标题", example = "Next.js 入门指南")
    private String title;

    @NotBlank(message = "slug 不能为空")
    @Schema(description = "文章 slug", example = "nextjs-getting-started")
    private String slug;

    @Schema(description = "兼容旧字段，等价于 excerpt", example = "从零开始学习 Next.js")
    private String summary;

    @Schema(description = "文章摘要，若为空由后端提取", example = "从零开始学习 Next.js")
    private String excerpt;

    @NotBlank(message = "正文不能为空")
    @Schema(description = "正文内容（MDX 或 tiptap-json 字符串）")
    private String content;

    @Schema(description = "正文格式，支持 mdx / tiptap-json，缺省时自动推断", example = "mdx")
    private String contentFormat;

    @NotNull(message = "状态不能为空")
    @Schema(description = "状态：0-草稿，1-已发布", example = "1")
    private Integer status;

    @Schema(description = "冲突检测基线更新时间；传入时会执行冲突校验")
    private LocalDateTime baseUpdatedAt;

    @Schema(description = "封面地址", example = "https://cdn.example.com/cover.webp")
    private String coverUrl;
}
