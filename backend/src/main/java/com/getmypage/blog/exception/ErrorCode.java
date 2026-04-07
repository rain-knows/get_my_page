package com.getmypage.blog.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 业务错误码枚举。
 */
@Getter
@AllArgsConstructor
public enum ErrorCode {

    BAD_REQUEST(40001, "参数校验失败"),
    UNAUTHORIZED(40101, "未登录或 Token 无效"),
    TOKEN_EXPIRED(40102, "Token 已过期"),
    FORBIDDEN(40301, "无权限访问"),
    NOT_FOUND(40401, "资源不存在"),
    CONFLICT(40901, "资源冲突"),
    INTERNAL_ERROR(50001, "系统内部错误"),
    DATABASE_ERROR(50002, "数据库操作失败"),
    EXTERNAL_SERVICE_ERROR(50003, "外部服务调用失败"),

    // 认证相关
    USERNAME_OR_PASSWORD_ERROR(40010, "用户名或密码错误"),
    USER_DISABLED(40011, "用户已被禁用"),
    USERNAME_ALREADY_EXISTS(40012, "用户名已存在"),
    REFRESH_TOKEN_INVALID(40013, "Refresh Token 无效");

    private final int code;
    private final String message;
}
