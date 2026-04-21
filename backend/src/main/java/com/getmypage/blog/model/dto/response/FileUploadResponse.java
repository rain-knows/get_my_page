package com.getmypage.blog.model.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 文件上传响应。
 */
@Data
@Builder
@Schema(description = "文件上传响应")
public class FileUploadResponse {

    @Schema(description = "对象存储访问 URL")
    private String url;

    @Schema(description = "对象存储 key")
    private String key;
}
