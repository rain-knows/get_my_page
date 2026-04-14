package com.getmypage.blog.service.auth;

import com.getmypage.blog.exception.BizException;
import com.getmypage.blog.exception.ErrorCode;
import com.getmypage.blog.model.dto.request.RegisterRequest;
import com.getmypage.blog.model.dto.response.LoginResponse;
import com.getmypage.blog.model.entity.User;
import com.getmypage.blog.security.auth.JwtTokenProvider;
import com.getmypage.blog.service.auth.impl.AuthServiceImpl;
import com.getmypage.blog.service.user.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private UserService userService;

    @InjectMocks
    private AuthServiceImpl authService;

    /**
     * 功能：验证注册成功路径会标准化字段并返回完整登录态令牌。
     * 关键参数：无（测试使用固定注册请求与 Mock 依赖）。
     * 返回值/副作用：无返回值；断言返回结果与依赖调用参数。
     */
    @Test
    void registerShouldNormalizeFieldsAndReturnTokens() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("  TestUser  ");
        request.setNickname("  TestNick  ");
        request.setEmail("  Test@Example.COM  ");
        request.setPassword("abc12345");

        User user = new User();
        user.setId(7L);
        user.setUsername("TestUser");
        user.setNickname("TestNick");
        user.setRole("USER");

        when(userService.createUser(
                eq("TestUser"),
                eq("abc12345"),
                eq("TestNick"),
                eq("test@example.com")
        )).thenReturn(user);
        when(jwtTokenProvider.generateAccessToken(7L, "TestUser", "USER")).thenReturn("access-token");
        when(jwtTokenProvider.generateRefreshToken(7L)).thenReturn("refresh-token");
        when(jwtTokenProvider.getAccessExpiration()).thenReturn(3600L);

        LoginResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("access-token", response.getAccessToken());
        assertEquals("refresh-token", response.getRefreshToken());
        assertEquals(3600L, response.getExpiresIn());
        assertEquals("TestUser", response.getUser().getUsername());
        verify(userService).createUser("TestUser", "abc12345", "TestNick", "test@example.com");
    }

    /**
     * 功能：验证弱密码在服务层会被拒绝且不会触发用户创建。
     * 关键参数：无（测试使用不符合复杂度规则的密码）。
     * 返回值/副作用：无返回值；断言抛出 BAD_REQUEST 并校验未调用下游依赖。
     */
    @Test
    void registerShouldRejectWeakPassword() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("test-user");
        request.setNickname("test-nickname");
        request.setPassword("onlyletters");

        BizException exception = assertThrows(BizException.class, () -> authService.register(request));

        assertEquals(ErrorCode.BAD_REQUEST, exception.getErrorCode());
        assertEquals("密码必须为 8-64 位且同时包含字母和数字", exception.getMessage());
        verify(userService, never()).createUser(anyString(), anyString(), anyString(), any());
        verifyNoInteractions(jwtTokenProvider);
    }
}
