package com.getmypage.blog.service.post;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.getmypage.blog.common.util.SecurityUtils;
import com.getmypage.blog.event.PostPublishedEvent;
import com.getmypage.blog.exception.BizException;
import com.getmypage.blog.exception.ErrorCode;
import com.getmypage.blog.mapper.PostMapper;
import com.getmypage.blog.model.dto.request.PostCreateRequest;
import com.getmypage.blog.model.dto.request.PostUpdateRequest;
import com.getmypage.blog.model.dto.response.PageResponse;
import com.getmypage.blog.model.dto.response.PostDetailResponse;
import com.getmypage.blog.model.dto.response.PostListItemResponse;
import com.getmypage.blog.model.entity.Post;
import com.getmypage.blog.service.post.impl.PostServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PostServiceImplTest {

    @Mock
    private PostMapper postMapper;

    @Mock
    private SecurityUtils securityUtils;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private PostServiceImpl postService;

    /**
     * 功能：每条用例结束后清理安全上下文，避免认证状态污染其他测试。
     * 关键参数：无。
     * 返回值/副作用：无返回值；副作用为清理 SecurityContextHolder。
     */
    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    /**
     * 功能：验证普通用户即使传 includeDraft=true 也只能读取已发布列表。
     * 关键参数：无（测试内部构造 page/size/includeDraft 输入）。
     * 返回值/副作用：无返回值；断言 includeDraft 对普通用户无效。
     */
    @Test
    void listPostsShouldIgnoreIncludeDraftWhenRequesterIsNotAdmin() {
        when(securityUtils.isAdmin()).thenReturn(false);
        when(postMapper.selectPostPage(0, 10, false)).thenReturn(List.of(buildPost(1L, "published", 1)));
        when(postMapper.countPosts(false)).thenReturn(1L);

        PageResponse<PostListItemResponse> page = postService.listPosts(1, 10, true);

        assertEquals(1, page.getRecords().size());
        assertEquals("published", page.getRecords().get(0).getSlug());
        verify(postMapper).selectPostPage(0, 10, false);
        verify(postMapper).countPosts(false);
    }

    /**
     * 功能：验证管理员传 includeDraft=true 时可读取包含草稿的数据视图。
     * 关键参数：无（测试内部构造管理员角色和草稿数据）。
     * 返回值/副作用：无返回值；断言 includeDraft 在管理员场景生效。
     */
    @Test
    void listPostsShouldIncludeDraftWhenRequesterIsAdmin() {
        when(securityUtils.isAdmin()).thenReturn(true);
        when(postMapper.selectPostPage(0, 10, true)).thenReturn(List.of(buildPost(2L, "draft", 0)));
        when(postMapper.countPosts(true)).thenReturn(1L);

        PageResponse<PostListItemResponse> page = postService.listPosts(1, 10, true);

        assertEquals(1, page.getRecords().size());
        assertEquals(0, page.getRecords().get(0).getStatus());
        verify(postMapper).selectPostPage(0, 10, true);
        verify(postMapper).countPosts(true);
    }

    /**
     * 功能：验证创建文章时非管理员会被拒绝并返回 40301 语义异常。
     * 关键参数：无（测试内部构造最小创建请求）。
     * 返回值/副作用：无返回值；断言抛出 FORBIDDEN 业务异常。
     */
    @Test
    void createPostShouldThrowForbiddenWhenRequesterIsNotAdmin() {
        when(securityUtils.isAdmin()).thenReturn(false);

        BizException exception = assertThrows(BizException.class, () -> postService.createPost(buildCreateRequest()));

        assertEquals(ErrorCode.FORBIDDEN, exception.getErrorCode());
    }

    /**
     * 功能：验证创建文章时 slug 冲突返回 40901。
     * 关键参数：无（测试内部模拟 slug 已存在）。
     * 返回值/副作用：无返回值；断言抛出 CONFLICT 业务异常。
     */
    @Test
    void createPostShouldThrowConflictWhenSlugAlreadyExists() {
        when(securityUtils.isAdmin()).thenReturn(true);
        when(postMapper.findBySlug("same-slug")).thenReturn(buildPost(9L, "same-slug", 1));

        PostCreateRequest request = buildCreateRequest();
        request.setSlug("same-slug");

        BizException exception = assertThrows(BizException.class, () -> postService.createPost(request));

        assertEquals(ErrorCode.CONFLICT, exception.getErrorCode());
    }

    /**
     * 功能：验证创建文章成功后会发布包含状态信息的文章变更事件。
     * 关键参数：无（测试内部模拟管理员认证与 mapper 写入行为）。
     * 返回值/副作用：无返回值；断言返回详情并触发事件发布。
     */
    @Test
    void createPostShouldPublishChangedEventWhenSuccess() {
        when(securityUtils.isAdmin()).thenReturn(true);
        when(postMapper.findBySlug("new-slug")).thenReturn(null);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(100L, null, List.of())
        );

        doAnswer(invocation -> {
            Post post = invocation.getArgument(0);
            post.setId(10L);
            return 1;
        }).when(postMapper).insert(any(Post.class));

        Post created = buildPost(10L, "new-slug", 1);
        when(postMapper.selectById(10L)).thenReturn(created);

        PostDetailResponse response = postService.createPost(buildCreateRequest());

        assertEquals(10L, response.getId());
        assertEquals("new-slug", response.getSlug());

        ArgumentCaptor<PostPublishedEvent> eventCaptor = ArgumentCaptor.forClass(PostPublishedEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertEquals(10L, eventCaptor.getValue().getPostId());
        assertEquals(1, eventCaptor.getValue().getStatus());
        assertFalse(eventCaptor.getValue().isDeleted());
    }

    /**
     * 功能：验证更新文章在 baseUpdatedAt 不匹配时返回 40901 冲突。
     * 关键参数：无（测试内部模拟数据库当前更新时间晚于请求基线）。
     * 返回值/副作用：无返回值；断言抛出 CONFLICT 业务异常。
     */
    @Test
    void updatePostShouldThrowConflictWhenBaseUpdatedAtMismatch() {
        when(securityUtils.isAdmin()).thenReturn(true);
        Post existing = buildPost(3L, "post-3", 1);
        existing.setUpdatedAt(LocalDateTime.of(2026, 4, 21, 10, 0, 0));
        when(postMapper.selectById(3L)).thenReturn(existing);

        PostUpdateRequest request = buildUpdateRequest();
        request.setBaseUpdatedAt(LocalDateTime.of(2026, 4, 20, 10, 0, 0));

        BizException exception = assertThrows(BizException.class, () -> postService.updatePost(3L, request));

        assertEquals(ErrorCode.CONFLICT, exception.getErrorCode());
    }

    /**
     * 功能：验证删除文章成功后会发布 deleted=true 的变更事件。
     * 关键参数：无（测试内部模拟管理员删除成功场景）。
     * 返回值/副作用：无返回值；断言事件包含删除标记。
     */
    @Test
    void deletePostShouldPublishDeletedEventWhenSuccess() {
        when(securityUtils.isAdmin()).thenReturn(true);
        when(postMapper.selectById(7L)).thenReturn(buildPost(7L, "post-7", 0));

        postService.deletePost(7L);

        ArgumentCaptor<PostPublishedEvent> eventCaptor = ArgumentCaptor.forClass(PostPublishedEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertEquals(7L, eventCaptor.getValue().getPostId());
        assertTrue(eventCaptor.getValue().isDeleted());
    }

    /**
     * 功能：验证详情查询在未命中时返回资源不存在异常。
     * 关键参数：无（测试内部模拟 mapper 未命中）。
     * 返回值/副作用：无返回值；断言抛出 NOT_FOUND 业务异常。
     */
    @Test
    void getPostDetailShouldThrowNotFoundWhenSlugNotExists() {
        when(securityUtils.isAdmin()).thenReturn(false);
        when(postMapper.findDetailBySlug("missing", false)).thenReturn(null);

        BizException exception = assertThrows(BizException.class, () -> postService.getPostDetail("missing", true));

        assertEquals(ErrorCode.NOT_FOUND, exception.getErrorCode());
    }

    /**
     * 功能：构造用于测试的创建请求对象。
     * 关键参数：无。
     * 返回值/副作用：返回创建请求；无副作用。
     */
    private PostCreateRequest buildCreateRequest() {
        PostCreateRequest request = new PostCreateRequest();
        request.setTitle("New Post");
        request.setSlug("new-slug");
        request.setExcerpt("excerpt");
        request.setContent(buildTiptapContent("content"));
        request.setContentFormat("tiptap-json");
        request.setStatus(1);
        request.setCoverUrl("https://cdn.example.com/cover.png");
        return request;
    }

    /**
     * 功能：构造用于测试的更新请求对象。
     * 关键参数：无。
     * 返回值/副作用：返回更新请求；无副作用。
     */
    private PostUpdateRequest buildUpdateRequest() {
        PostUpdateRequest request = new PostUpdateRequest();
        request.setTitle("Updated Title");
        request.setSlug("updated-slug");
        request.setExcerpt("updated excerpt");
        request.setContent(buildTiptapContent("updated"));
        request.setContentFormat("tiptap-json");
        request.setStatus(1);
        request.setCoverUrl("https://cdn.example.com/new.png");
        return request;
    }

    /**
     * 功能：构造 tiptap-json 格式正文 JSON，供创建/更新测试复用。
     * 关键参数：text 为段落文本。
     * 返回值/副作用：返回 JSON 字符串；无副作用。
     */
    private String buildTiptapContent(String text) {
        return "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"" + text + "\"}]}]}";
    }

    /**
     * 功能：构造用于测试的文章实体对象。
     * 关键参数：id 为文章 ID；slug 为文章 slug；status 为文章状态。
     * 返回值/副作用：返回文章实体；无副作用。
     */
    private Post buildPost(Long id, String slug, Integer status) {
        Post post = new Post();
        post.setId(id);
        post.setTitle("Title-" + id);
        post.setSlug(slug);
        post.setSummary("summary-" + id);
        post.setContent("# content-" + id);
        post.setStatus(status);
        post.setCreatedAt(LocalDateTime.of(2026, 4, 21, 8, 0, 0));
        post.setUpdatedAt(LocalDateTime.of(2026, 4, 21, 9, 0, 0));
        return post;
    }
}
