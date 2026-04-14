package com.getmypage.blog.service.user.impl;

import com.getmypage.blog.exception.BizException;
import com.getmypage.blog.exception.ErrorCode;
import com.getmypage.blog.mapper.UserMapper;
import com.getmypage.blog.model.entity.User;
import com.getmypage.blog.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 用户服务实现。
 */
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public User findByUsername(String username) {
        return userMapper.findByUsername(username);
    }

    @Override
    public User findById(Long id) {
        return userMapper.selectById(id);
    }

    /**
     * 功能：创建新用户并在写入前执行用户名/邮箱唯一性校验。
     * 关键参数：username 为登录名；password 为明文密码（会在内部加密）；nickname 为展示名；email 为可选邮箱。
     * 返回值/副作用：返回已持久化用户对象；会写入数据库并抛出业务异常表示冲突。
     */
    @Override
    public User createUser(String username, String password, String nickname, String email) {
        // 检查用户名是否已存在
        User existing = userMapper.findByUsername(username);
        if (existing != null) {
            throw new BizException(ErrorCode.USERNAME_ALREADY_EXISTS);
        }

        validateEmailUniqueness(email);

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setNickname(nickname);
        user.setAvatarUrl("");
        user.setEmail(StringUtils.hasText(email) ? email : null);
        user.setRole("USER");
        user.setStatus(1);

        userMapper.insert(user);
        return user;
    }

    /**
     * 功能：校验可选邮箱是否已被占用（忽略大小写）。
     * 关键参数：email 为标准化后的邮箱，可为空。
     * 返回值/副作用：无返回值；冲突时抛出 EMAIL_ALREADY_EXISTS 业务异常。
     */
    private void validateEmailUniqueness(String email) {
        if (!StringUtils.hasText(email)) {
            return;
        }
        User existingByEmail = userMapper.findByEmailIgnoreCase(email);
        if (existingByEmail != null) {
            throw new BizException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
    }
}
