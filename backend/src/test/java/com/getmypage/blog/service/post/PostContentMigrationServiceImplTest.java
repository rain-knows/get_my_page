package com.getmypage.blog.service.post;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.getmypage.blog.common.util.SecurityUtils;
import com.getmypage.blog.exception.BizException;
import com.getmypage.blog.exception.ErrorCode;
import com.getmypage.blog.mapper.PostMapper;
import com.getmypage.blog.model.dto.response.PostContentMigrationReportResponse;
import com.getmypage.blog.model.entity.Post;
import com.getmypage.blog.service.post.impl.PostContentMigrationServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PostContentMigrationServiceImplTest {

    @Mock
    private PostMapper postMapper;

    @Mock
    private SecurityUtils securityUtils;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private PostContentMigrationServiceImpl migrationService;

    /**
     * 功能：验证管理员触发迁移时可将 gmp-block-v1 与 mdx 文章转换为 tiptap-json，并统计迁移结果。
     * 关键参数：无（测试内部构造三类文章样本）。
     * 返回值/副作用：无返回值；断言迁移统计和 updateById 调用次数。
     */
    @Test
    void migrateAllPostsToTiptapJsonShouldMigrateLegacyFormats() {
        when(securityUtils.isAdmin()).thenReturn(true);
        when(postMapper.selectList(org.mockito.ArgumentMatchers.any())).thenReturn(List.of(
                buildPost(1L, "mdx-post", "# hello"),
                buildPost(2L, "tiptap-post", "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"world\"}]}]}"),
                buildPost(3L, "gmp-post", "{\"version\":\"gmp-block-v1\",\"blocks\":[]}")
        ));

        PostContentMigrationReportResponse report = migrationService.migrateAllPostsToTiptapJson();

        assertEquals(3, report.getTotalPosts());
        assertEquals(2, report.getMigratedPosts());
        assertEquals(1, report.getSkippedPosts());
        assertEquals(0, report.getFailedPosts());
        verify(postMapper, org.mockito.Mockito.times(2)).updateById(org.mockito.ArgumentMatchers.any(Post.class));
    }

    /**
     * 功能：验证非管理员触发迁移会被拒绝并返回 40301。
     * 关键参数：无。
     * 返回值/副作用：无返回值；断言抛出 FORBIDDEN 异常。
     */
    @Test
    void migrateAllPostsToTiptapJsonShouldRejectNonAdmin() {
        when(securityUtils.isAdmin()).thenReturn(false);

        BizException exception = assertThrows(BizException.class, () -> migrationService.migrateAllPostsToTiptapJson());

        assertEquals(ErrorCode.FORBIDDEN, exception.getErrorCode());
    }

    /**
     * 功能：构造最小文章实体样本，供迁移测试复用。
     * 关键参数：id 为文章 ID；slug 为文章 slug；content 为正文。
     * 返回值/副作用：返回文章实体；无副作用。
     */
    private Post buildPost(Long id, String slug, String content) {
        Post post = new Post();
        post.setId(id);
        post.setSlug(slug);
        post.setTitle(slug);
        post.setSummary("summary");
        post.setContent(content);
        post.setStatus(1);
        return post;
    }
}
