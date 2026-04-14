package com.getmypage.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.getmypage.blog.model.entity.User;

/**
 * 用户 Mapper 接口。
 */
public interface UserMapper extends BaseMapper<User> {

    /**
     * 功能：根据用户名查询未逻辑删除的用户记录。
     * 关键参数：username 为登录用户名。
     * 返回值/副作用：返回匹配用户，未命中时返回 null；无副作用。
     */
    User findByUsername(String username);

    /**
     * 功能：根据邮箱执行忽略大小写查询，匹配未逻辑删除用户。
     * 关键参数：email 为标准化后的邮箱字符串。
     * 返回值/副作用：返回匹配用户，未命中时返回 null；无副作用。
     */
    User findByEmailIgnoreCase(String email);
}
