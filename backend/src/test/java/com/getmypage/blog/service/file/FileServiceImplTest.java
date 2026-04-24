package com.getmypage.blog.service.file;

import com.getmypage.blog.common.util.SecurityUtils;
import com.getmypage.blog.exception.BizException;
import com.getmypage.blog.exception.ErrorCode;
import com.getmypage.blog.infrastructure.storage.StorageClient;
import com.getmypage.blog.model.dto.response.FileUploadResponse;
import com.getmypage.blog.service.file.impl.FileServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FileServiceImplTest {

    @Mock
    private StorageClient storageClient;

    @Mock
    private SecurityUtils securityUtils;

    @InjectMocks
    private FileServiceImpl fileService;

    /**
     * 功能：验证浏览器上传 `application/octet-stream` 时可按文件后缀回退为真实图片 MIME 并成功上传。
     * 关键参数：无（测试内部构造 heic 文件与 mock 行为）。
     * 返回值/副作用：无返回值；断言上传调用使用归一化 MIME `image/heic`。
     */
    @Test
    void uploadArticleAssetShouldFallbackToFilenameMimeWhenRequestMimeIsOctetStream() {
        mockAuthenticatedUser();
        MockMultipartFile file = new MockMultipartFile("file", "cover.heic", "application/octet-stream", new byte[]{1, 2, 3});

        when(storageClient.generateArticleObjectKey(9L, "cover.heic"))
                .thenReturn("/articles/2026/04/9/cover.heic");
        when(storageClient.upload(eq("/articles/2026/04/9/cover.heic"), any(byte[].class), eq("image/heic")))
                .thenReturn("http://localhost:9000/blog-assets/articles/2026/04/9/cover.heic");

        FileUploadResponse response = fileService.uploadArticleAsset(file, 9L);

        assertEquals("/articles/2026/04/9/cover.heic", response.getKey());
        assertEquals("http://localhost:9000/blog-assets/articles/2026/04/9/cover.heic", response.getUrl());
        verify(storageClient).upload(eq("/articles/2026/04/9/cover.heic"), any(byte[].class), eq("image/heic"));
    }

    /**
     * 功能：验证通用文件（如 PDF）可上传并按原始 MIME 传递到对象存储。
     * 关键参数：无（测试内部构造 PDF 文件与 mock 行为）。
     * 返回值/副作用：无返回值；断言上传调用使用 `application/pdf`。
     */
    @Test
    void uploadArticleAssetShouldAllowPdfUpload() {
        mockAuthenticatedUser();
        MockMultipartFile file = new MockMultipartFile("file", "manual.pdf", "application/pdf", new byte[]{1, 2});
        when(storageClient.generateArticleObjectKey(1L, "manual.pdf"))
                .thenReturn("/articles/2026/04/1/manual.pdf");
        when(storageClient.upload(eq("/articles/2026/04/1/manual.pdf"), any(byte[].class), eq("application/pdf")))
                .thenReturn("http://localhost:9000/blog-assets/articles/2026/04/1/manual.pdf");

        FileUploadResponse response = fileService.uploadArticleAsset(file, 1L);

        assertEquals("/articles/2026/04/1/manual.pdf", response.getKey());
        assertEquals("http://localhost:9000/blog-assets/articles/2026/04/1/manual.pdf", response.getUrl());
        verify(storageClient).upload(eq("/articles/2026/04/1/manual.pdf"), any(byte[].class), eq("application/pdf"));
    }

    /**
     * 功能：验证未登录用户上传文件时会被拒绝并返回无权限错误码。
     * 关键参数：无（测试内部构造普通图片文件）。
     * 返回值/副作用：无返回值；断言抛出 FORBIDDEN 异常。
     */
    @Test
    void uploadArticleAssetShouldRejectWhenUserIsNotAuthenticated() {
        when(securityUtils.isAuthenticated()).thenReturn(false);
        MockMultipartFile file = new MockMultipartFile("file", "cover.jpg", "image/jpeg", new byte[]{1, 2});

        BizException exception = assertThrows(BizException.class, () -> fileService.uploadArticleAsset(file, 1L));

        assertEquals(ErrorCode.FORBIDDEN, exception.getErrorCode());
    }

    /**
     * 功能：构造已登录且具备上传权限的用户上下文 mock。
     * 关键参数：无。
     * 返回值/副作用：无返回值；副作用为写入 securityUtils mock 返回值。
     */
    private void mockAuthenticatedUser() {
        when(securityUtils.isAuthenticated()).thenReturn(true);
        when(securityUtils.hasRole("ROLE_USER")).thenReturn(true);
    }
}
