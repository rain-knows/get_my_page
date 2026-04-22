package com.getmypage.blog.controller.embed;

import com.getmypage.blog.model.dto.request.EmbedResolveRequest;
import com.getmypage.blog.model.dto.response.ApiResponse;
import com.getmypage.blog.model.dto.response.EmbedResolveResponse;
import com.getmypage.blog.service.embed.EmbedService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Embed 解析控制器。
 */
@RestController
@RequestMapping("/api/embeds")
@RequiredArgsConstructor
@Tag(name = "Embed 模块", description = "外链解析接口")
public class EmbedController {

    private final EmbedService embedService;

    /**
     * 功能：统一解析外链并自动识别卡片类型（GitHub/音乐/视频/通用链接）。
     * 关键参数：request 为解析请求，包含原始链接。
     * 返回值/副作用：返回统一解析响应；无副作用。
     */
    @Operation(summary = "统一解析卡片", description = "自动识别链接类型并返回可直接渲染的卡片快照")
    @PostMapping("/resolve")
    public ApiResponse<EmbedResolveResponse> resolve(@Valid @RequestBody EmbedResolveRequest request) {
        return ApiResponse.success(embedService.resolve(request.getUrl()));
    }

    /**
     * 功能：解析 GitHub 链接并返回可写入编辑器节点的标准结构。
     * 关键参数：request 为解析请求，包含原始链接。
     * 返回值/副作用：返回 GitHub 解析响应；无副作用。
     */
    @Operation(summary = "解析 GitHub 卡片", description = "将 GitHub URL 或 owner/repo 解析为统一结构")
    @PostMapping("/github/resolve")
    public ApiResponse<EmbedResolveResponse> resolveGithub(@Valid @RequestBody EmbedResolveRequest request) {
        return ApiResponse.success(embedService.resolveGithub(request.getUrl()));
    }

    /**
     * 功能：解析音乐链接并返回可写入编辑器节点的标准结构。
     * 关键参数：request 为解析请求，包含原始链接。
     * 返回值/副作用：返回音乐解析响应；无副作用。
     */
    @Operation(summary = "解析音乐卡片", description = "解析 Spotify/网易云/Apple Music/Bilibili 链接")
    @PostMapping("/music/resolve")
    public ApiResponse<EmbedResolveResponse> resolveMusic(@Valid @RequestBody EmbedResolveRequest request) {
        return ApiResponse.success(embedService.resolveMusic(request.getUrl()));
    }
}
