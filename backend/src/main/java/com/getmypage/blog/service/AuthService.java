package com.getmypage.blog.service;

import com.getmypage.blog.model.dto.request.LoginRequest;
import com.getmypage.blog.model.dto.request.RegisterRequest;
import com.getmypage.blog.model.dto.response.LoginResponse;

/**
 * 认证服务接口。
 */
public interface AuthService {

    /**
     * 用户登录。
     */
    LoginResponse login(LoginRequest request);

    /**
     * 用户注册。
     */
    LoginResponse register(RegisterRequest request);

    /**
     * 刷新 Access Token。
     */
    LoginResponse refreshToken(String refreshToken);

    /**
     * 用户登出。
     */
    void logout(Long userId);
}
