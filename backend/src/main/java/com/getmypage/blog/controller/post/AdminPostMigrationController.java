package com.getmypage.blog.controller.post;

import com.getmypage.blog.model.dto.response.ApiResponse;
import com.getmypage.blog.model.dto.response.PostContentMigrationReportResponse;
import com.getmypage.blog.service.post.PostContentMigrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 管理员文章迁移控制器。
 */
@RestController
@RequestMapping("/api/admin/posts")
@RequiredArgsConstructor
@Tag(name = "管理员文章迁移模块", description = "文章正文迁移接口")
public class AdminPostMigrationController {

    private final PostContentMigrationService postContentMigrationService;

    /**
     * 功能：触发一次性正文协议迁移，将历史正文统一转换为 tiptap-json。
     * 关键参数：无。
     * 返回值/副作用：返回迁移报告；副作用为批量更新文章正文内容。
     */
    @Operation(summary = "迁移正文到 tiptap-json", description = "仅管理员可调用，返回成功/失败统计与失败明细")
    @PostMapping("/migrate-content")
    public ApiResponse<PostContentMigrationReportResponse> migrateContentToTiptapJson() {
        return ApiResponse.success(postContentMigrationService.migrateAllPostsToTiptapJson());
    }
}
