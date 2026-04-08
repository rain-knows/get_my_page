package com.getmypage.blog.controller.auth;

import com.getmypage.blog.model.dto.request.LoginRequest;
import com.getmypage.blog.model.dto.request.RegisterRequest;
import com.getmypage.blog.model.dto.response.ApiResponse;
import com.getmypage.blog.model.dto.response.LoginResponse;
import com.getmypage.blog.service.auth.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 认证控制器。
 * 处理登录、注册、刷新令牌、登出等认证相关接口。
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "认证模块", description = "用户登录、注册、令牌管理")
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "用户登录", description = "使用用户名和密码登录，返回 Access Token 和 Refresh Token")
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ApiResponse.success("登录成功", response);
    }

    @Operation(summary = "用户注册", description = "注册新用户，注册成功后自动登录")
    @PostMapping("/register")
    public ApiResponse<LoginResponse> register(@Valid @RequestBody RegisterRequest request) {
        LoginResponse response = authService.register(request);
        return ApiResponse.success("注册成功", response);
    }

    @Operation(summary = "刷新 Access Token", description = "使用 Refresh Token 获取新的 Access Token")
    @PostMapping("/refresh")
    public ApiResponse<LoginResponse> refreshToken(@RequestBody RefreshTokenRequest request) {
        LoginResponse response = authService.refreshToken(request.getRefreshToken());
        return ApiResponse.success("刷新成功", response);
    }

    @Operation(summary = "用户登出", description = "将当前 Token 加入黑名单")
    @PostMapping("/logout")
    public ApiResponse<Void> logout() {
        // 从 SecurityContext 获取当前用户 ID
        authService.logout(null); // TODO: extract from SecurityContext
        return ApiResponse.success("登出成功", null);
    }

    /**
     * 刷新 Token 请求 DTO。
     */
    @lombok.Data
    public static class RefreshTokenRequest {
        private String refreshToken;
    }
}
