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
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * 认证服务实现
 */
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final Pattern PASSWORD_COMPLEXITY_PATTERN = Pattern.compile("^(?=.*[A-Za-z])(?=.*\\d).{8,64}$");

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;

    @Override
    public LoginResponse login(LoginRequest request) {
        // 使用 Spring Security 认证
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
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
                .avatarUrl(normalizeAvatarUrl(user.getAvatarUrl()))
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
     * 功能：执行用户注册并在成功后签发登录态 Token。
     * 关键参数：request 为注册请求，包含用户名、密码、昵称、可选邮箱。
     * 返回值/副作用：返回登录响应对象；副作用为创建用户记录并生成访问令牌。
     */
    @Override
    public LoginResponse register(RegisterRequest request) {
        String normalizedUsername = normalizeRequiredField(request.getUsername(), "用户名");
        String normalizedNickname = normalizeRequiredField(request.getNickname(), "昵称");
        String normalizedEmail = normalizeOptionalEmail(request.getEmail());
        validatePasswordStrength(request.getPassword());

        User user = userService.createUser(
                normalizedUsername,
                request.getPassword(),
                normalizedNickname,
                normalizedEmail);

        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getUsername(), user.getRole());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        LoginResponse.UserInfo userInfo = LoginResponse.UserInfo.builder()
                .id(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .avatarUrl(normalizeAvatarUrl(user.getAvatarUrl()))
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
     * 功能：标准化必填文本字段，移除首尾空白并保证非空。
     * 关键参数：rawValue 为原始输入值；fieldName 为字段中文名用于错误提示。
     * 返回值/副作用：返回标准化后的字符串；当字段为空时抛出参数异常。
     */
    private String normalizeRequiredField(String rawValue, String fieldName) {
        if (!StringUtils.hasText(rawValue)) {
            throw new BizException(ErrorCode.BAD_REQUEST, fieldName + "不能为空");
        }
        return rawValue.trim();
    }

    /**
     * 功能：标准化可选邮箱字段，去除空白并统一为小写。
     * 关键参数：rawEmail 为原始邮箱输入。
     * 返回值/副作用：返回标准化邮箱；空值或空白字符串会被转换为 null。
     */
    private String normalizeOptionalEmail(String rawEmail) {
        if (!StringUtils.hasText(rawEmail)) {
            return null;
        }
        return rawEmail.trim().toLowerCase(Locale.ROOT);
    }

    /**
     * 功能：校验注册密码复杂度是否满足 8-64 位且同时包含字母与数字。
     * 关键参数：password 为待校验明文密码。
     * 返回值/副作用：无返回值；不满足规则时抛出参数异常。
     */
    private void validatePasswordStrength(String password) {
        if (!StringUtils.hasText(password) || !PASSWORD_COMPLEXITY_PATTERN.matcher(password).matches()) {
            throw new BizException(ErrorCode.BAD_REQUEST, "密码必须为 8-64 位且同时包含字母和数字");
        }
    }

    /**
     * 功能：将头像地址标准化为非空字符串，避免接口返回 null。
     * 关键参数：avatarUrl 为数据库中的头像地址，可为 null。
     * 返回值/副作用：返回可直接透传给前端的头像地址；空值会被转换为空字符串。
     */
    private String normalizeAvatarUrl(String avatarUrl) {
        return avatarUrl == null ? "" : avatarUrl;
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
