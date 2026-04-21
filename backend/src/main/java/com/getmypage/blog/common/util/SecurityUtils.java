package com.getmypage.blog.common.util;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * 安全上下文工具。
 */
@Component
public class SecurityUtils {

    /**
     * 功能：判断当前请求上下文是否存在已认证用户。
     * 关键参数：无。
     * 返回值/副作用：返回 true 表示存在非匿名认证；无副作用。
     */
    public boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);
    }

    /**
     * 功能：判断当前用户是否具有管理员角色。
     * 关键参数：无。
     * 返回值/副作用：返回 true 表示当前认证主体具备 ROLE_ADMIN；无副作用。
     */
    public boolean isAdmin() {
        return hasRole("ROLE_ADMIN");
    }

    /**
     * 功能：判断当前用户是否具备指定角色标识。
     * 关键参数：roleAuthority 为完整权限名（如 ROLE_USER、ROLE_ADMIN）。
     * 返回值/副作用：返回 true 表示命中该角色权限；无副作用。
     */
    public boolean hasRole(String roleAuthority) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> roleAuthority.equals(authority.getAuthority()));
    }
}
