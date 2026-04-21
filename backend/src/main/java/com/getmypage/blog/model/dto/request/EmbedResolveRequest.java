package com.getmypage.blog.model.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Embed 解析请求。
 */
@Data
@Schema(description = "Embed 解析请求")
public class EmbedResolveRequest {

    @NotBlank(message = "url 不能为空")
    @Schema(description = "待解析链接", example = "https://github.com/spring-projects/spring-boot")
    private String url;
}
