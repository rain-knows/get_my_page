package com.getmypage.blog.service.auth.impl;

import com.getmypage.blog.exception.BizException;
import com.getmypage.blog.exception.ErrorCode;
import com.getmypage.blog.model.dto.request.LoginRequest;
import com.getmypage.blog.model.dto.request.RegisterRequest;
import com.getmypage.blog.model.dto.response.LoginResponse;
import com.getmypage.blog.model.entity.User;
import com.getmypage.blog.security.auth.JwtTokenProvider;
import com.getmypage.blog.service.auth.AuthService;
import com.getmypage.blog.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * 认证服务实现
 */
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;

    @Override
    public LoginResponse login(LoginRequest request) {
        // 使用 Spring Security 认证
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
        } catch (Exception e) {
            throw new BizException(ErrorCode.USERNAME_OR_PASSWORD_ERROR);
        }

        // 获取用户信息
        User user = userService.findByUsername(request.getUsername());
        if (user == null) {
            throw new BizException(ErrorCode.USERNAME_OR_PASSWORD_ERROR);
        }

        if (user.getStatus() != 1) {
            throw new BizException(ErrorCode.USER_DISABLED);
        }

        // 生成 Token
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getUsername(), user.getRole());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        LoginResponse.UserInfo userInfo = LoginResponse.UserInfo.builder()
                .id(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .build();

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtTokenProvider.getAccessExpiration())
                .tokenType("Bearer")
                .user(userInfo)
                .build();
    }
    /**
     * 注册服务实现
     * 
     */
    @Override
    public LoginResponse register(RegisterRequest request) {
        User user = userService.createUser(
                request.getUsername(), request.getPassword(),
                request.getNickname(), request.getEmail());

        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getUsername(), user.getRole());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        LoginResponse.UserInfo userInfo = LoginResponse.UserInfo.builder()
                .id(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .build();

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtTokenProvider.getAccessExpiration())
                .tokenType("Bearer")
                .user(userInfo)
                .build();
    }

    @Override
    public LoginResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new BizException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        Long userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
        User user = userService.findById(userId);
        if (user == null) {
            throw new BizException(ErrorCode.UNAUTHORIZED);
        }

        String newAccessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getUsername(), user.getRole());

        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtTokenProvider.getAccessExpiration())
                .tokenType("Bearer")
                .build();
    }

    @Override
    public void logout(Long userId) {
        // TODO: 将 token 加入 Redis 黑名单
    }
}
