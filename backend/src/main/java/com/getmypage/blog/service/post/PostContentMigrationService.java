package com.getmypage.blog.service.post;

import com.getmypage.blog.model.dto.response.PostContentMigrationReportResponse;

/**
 * 文章正文迁移服务。
 */
public interface PostContentMigrationService {

    /**
     * 功能：将历史正文统一迁移为 tiptap-json 协议，并输出迁移报告。
     * 关键参数：无。
     * 返回值/副作用：返回迁移报告；副作用为批量更新 post.content。
     */
    PostContentMigrationReportResponse migrateAllPostsToTiptapJson();
}
