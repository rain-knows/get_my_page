package com.getmypage.blog.model.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * 搜索响应。
 */
@Data
@Builder
@Schema(description = "搜索响应")
public class SearchResponse {

    @Schema(description = "命中列表")
    private List<SearchHitResponse> hits;

    @Schema(description = "估算命中总数", example = "5")
    private long estimatedTotalHits;

    @Schema(description = "处理耗时毫秒", example = "2")
    private long processingTimeMs;

    @Schema(description = "是否走了降级检索")
    private boolean degraded;
}
