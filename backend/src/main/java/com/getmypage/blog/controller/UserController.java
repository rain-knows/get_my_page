package com.getmypage.blog.controller;

import com.getmypage.blog.model.dto.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * 用户信息控制器。
 */
@RestController
@RequestMapping("/api/users")
@Tag(name = "用户模块", description = "用户信息管理")
public class UserController {

    @Operation(summary = "获取当前用户信息")
    @GetMapping("/me")
    public ApiResponse<Object> getCurrentUser(Principal principal) {
        if (principal == null) {
            return ApiResponse.error(40101, "未登录");
        }
        return ApiResponse.success(principal.getName(), null);
    }
}
