package com.getmypage.blog.service.user;

import com.getmypage.blog.model.entity.User;

/**
 * 用户服务接口。
 */
public interface UserService {

    /**
     * 根据用户名查询用户。
     */
    User findByUsername(String username);

    /**
     * 根据 ID 查询用户。
     */
    User findById(Long id);

    /**
     * 创建新用户。
     */
    User createUser(String username, String password, String nickname, String email);
}
