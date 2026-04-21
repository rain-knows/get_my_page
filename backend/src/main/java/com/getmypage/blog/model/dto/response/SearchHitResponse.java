package com.getmypage.blog.model.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 搜索命中项。
 */
@Data
@Builder
@Schema(description = "搜索命中项")
public class SearchHitResponse {

    @Schema(description = "文章 ID", example = "1")
    private Long id;

    @Schema(description = "标题（可能含高亮标记）")
    private String title;

    @Schema(description = "摘要（可能含高亮标记）")
    private String summary;

    @Schema(description = "文章 slug")
    private String slug;

    @Schema(description = "封面地址")
    private String coverUrl;
}
