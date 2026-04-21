package com.getmypage.blog.model.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * 分页响应。
 */
@Data
@Builder
@Schema(description = "分页响应")
public class PageResponse<T> {

    @Schema(description = "当前页记录")
    private List<T> records;

    @Schema(description = "当前页码", example = "1")
    private long current;

    @Schema(description = "每页大小", example = "10")
    private long size;

    @Schema(description = "总记录数", example = "128")
    private long total;

    @Schema(description = "总页数", example = "13")
    private long pages;
}
