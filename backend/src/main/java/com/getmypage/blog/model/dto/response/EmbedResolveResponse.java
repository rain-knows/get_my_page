package com.getmypage.blog.model.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.util.Map;

/**
 * Embed 解析响应。
 */
@Data
@Builder
@Schema(description = "Embed 解析响应")
public class EmbedResolveResponse {

    @Schema(description = "平台标识", example = "github")
    private String provider;

    @Schema(description = "标准化后的链接")
    private String normalizedUrl;

    @Schema(description = "是否解析成功")
    private boolean resolved;

    @Schema(description = "降级展示链接")
    private String fallbackUrl;

    @Schema(description = "可直接写入节点 attrs 的快照信息")
    private Map<String, Object> snapshot;
}
