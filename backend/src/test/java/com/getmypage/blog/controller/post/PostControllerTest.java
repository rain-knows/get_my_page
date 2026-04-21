package com.getmypage.blog.controller.post;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.getmypage.blog.exception.BizException;
import com.getmypage.blog.exception.ErrorCode;
import com.getmypage.blog.exception.GlobalExceptionHandler;
import com.getmypage.blog.model.dto.request.PostCreateRequest;
import com.getmypage.blog.model.dto.request.PostUpdateRequest;
import com.getmypage.blog.model.dto.response.PageResponse;
import com.getmypage.blog.model.dto.response.PostDetailResponse;
import com.getmypage.blog.model.dto.response.PostListItemResponse;
import com.getmypage.blog.service.post.PostService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PostControllerTest {

    @Mock
    private PostService postService;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    /**
     * 功能：构建控制器测试所需的 MockMvc 环境并注册全局异常处理器。
     * 关键参数：无。
     * 返回值/副作用：无返回值；副作用为初始化测试基础设施。
     */
    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(new PostController(postService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    /**
     * 功能：验证文章列表接口返回统一分页响应结构。
     * 关键参数：无（测试内部模拟服务层返回分页数据）。
     * 返回值/副作用：无返回值；断言 HTTP 200 且 records 可读取。
     */
    @Test
    void listPostsShouldReturnPageData() throws Exception {
        PostListItemResponse item = PostListItemResponse.builder()
                .id(1L)
                .title("title")
                .slug("slug")
                .excerpt("excerpt")
                .summary("excerpt")
                .contentFormat("mdx")
                .status(1)
                .updatedAt(LocalDateTime.of(2026, 4, 21, 10, 0, 0))
                .baseUpdatedAt(LocalDateTime.of(2026, 4, 21, 10, 0, 0))
                .build();
        PageResponse<PostListItemResponse> page = PageResponse.<PostListItemResponse>builder()
                .records(List.of(item))
                .current(1)
                .size(10)
                .total(1)
                .pages(1)
                .build();

        when(postService.listPosts(1, 10, false)).thenReturn(page);

        mockMvc.perform(get("/api/posts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.records[0].slug").value("slug"));
    }

    /**
     * 功能：验证非管理员创建文章时会返回 40301。
     * 关键参数：无（测试内部模拟服务层抛出 FORBIDDEN 异常）。
     * 返回值/副作用：无返回值；断言 HTTP 403 与业务错误码 40301。
     */
    @Test
    void createPostShouldReturn40301WhenForbidden() throws Exception {
        when(postService.createPost(any(PostCreateRequest.class)))
                .thenThrow(new BizException(ErrorCode.FORBIDDEN, "无权限访问"));

        PostCreateRequest request = new PostCreateRequest();
        request.setTitle("title");
        request.setSlug("slug");
        request.setExcerpt("excerpt");
        request.setContent("# content");
        request.setContentFormat("mdx");
        request.setStatus(1);

        mockMvc.perform(post("/api/posts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(40301));
    }

    /**
     * 功能：验证更新文章冲突时会返回 40901。
     * 关键参数：无（测试内部模拟服务层抛出 CONFLICT 异常）。
     * 返回值/副作用：无返回值；断言 HTTP 409 与业务错误码 40901。
     */
    @Test
    void updatePostShouldReturn40901WhenConflict() throws Exception {
        when(postService.updatePost(eq(1L), any(PostUpdateRequest.class)))
                .thenThrow(new BizException(ErrorCode.CONFLICT, "文章已被其他人更新，请刷新后重试"));

        PostUpdateRequest request = new PostUpdateRequest();
        request.setTitle("title");
        request.setSlug("slug");
        request.setExcerpt("excerpt");
        request.setContent("# content");
        request.setContentFormat("mdx");
        request.setStatus(1);

        mockMvc.perform(put("/api/posts/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(40901));
    }

    /**
     * 功能：验证删除文章成功路径返回统一成功响应。
     * 关键参数：无。
     * 返回值/副作用：无返回值；断言 HTTP 200 与成功 code。
     */
    @Test
    void deletePostShouldReturnSuccess() throws Exception {
        mockMvc.perform(delete("/api/posts/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    /**
     * 功能：验证详情查询参数透传到服务层并返回详情响应。
     * 关键参数：无（测试内部模拟服务层详情返回）。
     * 返回值/副作用：无返回值；断言响应中的 slug 与状态字段。
     */
    @Test
    void getPostDetailShouldReturnDetailData() throws Exception {
        PostDetailResponse detail = PostDetailResponse.builder()
                .id(1L)
                .title("title")
                .slug("slug")
                .excerpt("excerpt")
                .summary("excerpt")
                .content("# content")
                .contentFormat("mdx")
                .status(1)
                .createdAt(LocalDateTime.of(2026, 4, 21, 8, 0, 0))
                .updatedAt(LocalDateTime.of(2026, 4, 21, 9, 0, 0))
                .baseUpdatedAt(LocalDateTime.of(2026, 4, 21, 9, 0, 0))
                .build();
        when(postService.getPostDetail("slug", false)).thenReturn(detail);

        mockMvc.perform(get("/api/posts/slug"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.slug").value("slug"))
                .andExpect(jsonPath("$.data.status").value(1));
    }
}
