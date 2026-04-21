package com.getmypage.blog.exception;

import com.getmypage.blog.model.dto.response.ApiResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler();

    /**
     * 功能：验证 FORBIDDEN 业务异常会映射为 HTTP 403 与错误码 40301。
     * 关键参数：无（测试内部构造 FORBIDDEN 业务异常）。
     * 返回值/副作用：无返回值；断言状态码与业务错误码一致。
     */
    @Test
    void handleBizExceptionShouldMapForbiddenToHttp403() {
        BizException exception = new BizException(ErrorCode.FORBIDDEN, "无权限访问");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleBizException(exception);

        assertEquals(403, response.getStatusCode().value());
        assertEquals(40301, response.getBody().getCode());
    }

    /**
     * 功能：验证 CONFLICT 业务异常会映射为 HTTP 409 与错误码 40901。
     * 关键参数：无（测试内部构造 CONFLICT 业务异常）。
     * 返回值/副作用：无返回值；断言状态码与业务错误码一致。
     */
    @Test
    void handleBizExceptionShouldMapConflictToHttp409() {
        BizException exception = new BizException(ErrorCode.CONFLICT, "资源冲突");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleBizException(exception);

        assertEquals(409, response.getStatusCode().value());
        assertEquals(40901, response.getBody().getCode());
    }

    /**
     * 功能：验证 AccessDeniedException 会统一返回 40301。
     * 关键参数：无（测试内部直接传入访问拒绝异常）。
     * 返回值/副作用：无返回值；断言状态码与错误码符合约定。
     */
    @Test
    void handleAccessDeniedShouldReturn40301() {
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleAccessDenied(new AccessDeniedException("denied"));

        assertEquals(403, response.getStatusCode().value());
        assertEquals(40301, response.getBody().getCode());
    }
}
