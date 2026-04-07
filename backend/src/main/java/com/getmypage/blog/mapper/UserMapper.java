package com.getmypage.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.getmypage.blog.model.entity.User;

/**
 * 用户 Mapper 接口。
 */
public interface UserMapper extends BaseMapper<User> {

    /**
     * 根据用户名查询用户。
     */
    User findByUsername(String username);
}
