package com.getmypage.blog.model.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * 文章正文迁移报告响应。
 */
@Data
@Builder
@Schema(description = "文章正文迁移报告")
public class PostContentMigrationReportResponse {

    @Schema(description = "总文章数", example = "128")
    private int totalPosts;

    @Schema(description = "成功迁移数", example = "120")
    private int migratedPosts;

    @Schema(description = "跳过数（已是目标格式）", example = "6")
    private int skippedPosts;

    @Schema(description = "失败数", example = "2")
    private int failedPosts;

    @Schema(description = "失败详情列表")
    private List<FailedItem> failedItems;

    /**
     * 迁移失败明细。
     */
    @Data
    @Builder
    @Schema(description = "迁移失败明细")
    public static class FailedItem {

        @Schema(description = "文章 ID", example = "42")
        private Long postId;

        @Schema(description = "文章 slug", example = "my-legacy-post")
        private String slug;

        @Schema(description = "失败原因")
        private String reason;
    }
}
