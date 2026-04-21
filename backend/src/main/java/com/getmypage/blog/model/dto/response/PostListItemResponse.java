package com.getmypage.blog.model.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 文章列表项响应。
 */
@Data
@Builder
@Schema(description = "文章列表项")
public class PostListItemResponse {

    @Schema(description = "文章 ID", example = "1")
    private Long id;

    @Schema(description = "文章标题", example = "Next.js 入门指南")
    private String title;

    @Schema(description = "文章 slug", example = "nextjs-getting-started")
    private String slug;

    @Schema(description = "摘要字段（新语义）")
    private String excerpt;

    @Schema(description = "兼容旧字段，值与 excerpt 一致")
    private String summary;

    @Schema(description = "正文格式", example = "mdx")
    private String contentFormat;

    @Schema(description = "文章状态：0-草稿，1-已发布", example = "1")
    private Integer status;

    @Schema(description = "封面地址")
    private String coverUrl;

    @Schema(description = "更新时间")
    private LocalDateTime updatedAt;

    @Schema(description = "更新冲突基线时间，值与 updatedAt 一致")
    private LocalDateTime baseUpdatedAt;
}
