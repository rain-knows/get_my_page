package com.getmypage.blog.exception;

import com.getmypage.blog.model.dto.response.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常处理器。
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 功能：处理业务异常并按错误码映射 HTTP 状态，避免业务失败返回 200。
     * 关键参数：e 为业务异常对象，包含错误码与消息。
     * 返回值/副作用：返回统一错误响应与匹配的 HTTP 状态码；无其他副作用。
     */
    @ExceptionHandler(BizException.class)
    public ResponseEntity<ApiResponse<Void>> handleBizException(BizException e) {
        log.warn("Business exception: {}", e.getMessage());
        ErrorCode ec = e.getErrorCode();
        HttpStatus status = mapErrorCodeToHttpStatus(ec);
        return ResponseEntity.status(status).body(ApiResponse.error(ec.getCode(), e.getMessage()));
    }

    /**
     * 功能：统一处理访问拒绝异常并返回 40301 错误语义。
     * 关键参数：e 为权限拒绝异常。
     * 返回值/副作用：返回 403 状态的统一错误响应；无其他副作用。
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException e) {
        log.warn("Access denied: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(ErrorCode.FORBIDDEN.getCode(), ErrorCode.FORBIDDEN.getMessage()));
    }

    /**
     * 功能：处理 @Valid 请求体校验异常并汇总字段错误信息。
     * 关键参数：e 为请求体验证异常。
     * 返回值/副作用：返回 40001 错误响应；无其他副作用。
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .reduce((a, b) -> a + "; " + b)
                .orElse("参数校验失败");
        log.warn("Validation failed: {}", msg);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ErrorCode.BAD_REQUEST.getCode(), msg));
    }

    /**
     * 功能：处理参数绑定异常并输出统一参数错误响应。
     * 关键参数：e 为参数绑定异常。
     * 返回值/副作用：返回 40001 错误响应；无其他副作用。
     */
    @ExceptionHandler(BindException.class)
    public ResponseEntity<ApiResponse<Void>> handleBindException(BindException e) {
        String msg = e.getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .reduce((a, b) -> a + "; " + b)
                .orElse("参数绑定失败");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ErrorCode.BAD_REQUEST.getCode(), msg));
    }

    /**
     * 功能：处理约束校验异常并输出统一参数错误响应。
     * 关键参数：e 为约束校验异常。
     * 返回值/副作用：返回 40001 错误响应；无其他副作用。
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(ConstraintViolationException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ErrorCode.BAD_REQUEST.getCode(), e.getMessage()));
    }

    /**
     * 功能：兜底处理未捕获异常并屏蔽内部错误细节。
     * 关键参数：e 为未捕获异常。
     * 返回值/副作用：返回 50001 错误响应；无其他副作用。
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Unexpected error", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(ErrorCode.INTERNAL_ERROR.getCode(), "系统内部错误"));
    }

    /**
     * 功能：将业务错误码映射到 HTTP 状态码，统一 API 传输语义。
     * 关键参数：errorCode 为业务错误码枚举。
     * 返回值/副作用：返回对应 HTTP 状态；无副作用。
     */
    private HttpStatus mapErrorCodeToHttpStatus(ErrorCode errorCode) {
        return switch (errorCode) {
            case BAD_REQUEST, USERNAME_OR_PASSWORD_ERROR, USER_DISABLED, USERNAME_ALREADY_EXISTS,
                 REFRESH_TOKEN_INVALID, EMAIL_ALREADY_EXISTS -> HttpStatus.BAD_REQUEST;
            case UNAUTHORIZED, TOKEN_EXPIRED -> HttpStatus.UNAUTHORIZED;
            case FORBIDDEN -> HttpStatus.FORBIDDEN;
            case NOT_FOUND -> HttpStatus.NOT_FOUND;
            case CONFLICT -> HttpStatus.CONFLICT;
            case INTERNAL_ERROR, DATABASE_ERROR, EXTERNAL_SERVICE_ERROR -> HttpStatus.INTERNAL_SERVER_ERROR;
        };
    }
}
