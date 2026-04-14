package com.getmypage.blog.service.user;

import com.getmypage.blog.exception.BizException;
import com.getmypage.blog.exception.ErrorCode;
import com.getmypage.blog.mapper.UserMapper;
import com.getmypage.blog.model.entity.User;
import com.getmypage.blog.service.user.impl.UserServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserMapper userMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    /**
     * 功能：验证用户名冲突时会抛出 USERNAME_ALREADY_EXISTS。
     * 关键参数：无（测试通过 Mock 返回已存在用户名）。
     * 返回值/副作用：无返回值；断言不会触发写库。
     */
    @Test
    void createUserShouldThrowWhenUsernameExists() {
        User existingUser = new User();
        existingUser.setId(1L);
        existingUser.setUsername("alice");
        when(userMapper.findByUsername("alice")).thenReturn(existingUser);

        BizException exception = assertThrows(BizException.class,
                () -> userService.createUser("alice", "abc12345", "Alice", "alice@example.com"));

        assertEquals(ErrorCode.USERNAME_ALREADY_EXISTS, exception.getErrorCode());
        verify(userMapper, never()).insert(any(User.class));
    }

    /**
     * 功能：验证邮箱冲突时会抛出 EMAIL_ALREADY_EXISTS。
     * 关键参数：无（测试通过 Mock 返回已存在邮箱）。
     * 返回值/副作用：无返回值；断言不会触发写库。
     */
    @Test
    void createUserShouldThrowWhenEmailExists() {
        User existingEmailUser = new User();
        existingEmailUser.setId(2L);
        existingEmailUser.setEmail("alice@example.com");

        when(userMapper.findByUsername("alice")).thenReturn(null);
        when(userMapper.findByEmailIgnoreCase("alice@example.com")).thenReturn(existingEmailUser);

        BizException exception = assertThrows(BizException.class,
                () -> userService.createUser("alice", "abc12345", "Alice", "alice@example.com"));

        assertEquals(ErrorCode.EMAIL_ALREADY_EXISTS, exception.getErrorCode());
        verify(userMapper, never()).insert(any(User.class));
    }

    /**
     * 功能：验证创建用户成功时会加密密码并写入默认角色状态。
     * 关键参数：无（测试使用固定输入并拦截 insert 参数）。
     * 返回值/副作用：无返回值；断言写入实体字段符合预期。
     */
    @Test
    void createUserShouldInsertEncodedPasswordAndDefaults() {
        when(userMapper.findByUsername("alice")).thenReturn(null);
        when(userMapper.findByEmailIgnoreCase("alice@example.com")).thenReturn(null);
        when(passwordEncoder.encode("abc12345")).thenReturn("ENCODED_PASSWORD");
        when(userMapper.insert(any(User.class))).thenAnswer(invocation -> {
            User inserted = invocation.getArgument(0);
            inserted.setId(99L);
            return 1;
        });

        User created = userService.createUser("alice", "abc12345", "Alice", "alice@example.com");

        assertEquals(99L, created.getId());
        assertEquals("alice", created.getUsername());
        assertEquals("Alice", created.getNickname());
        assertEquals("alice@example.com", created.getEmail());
        assertEquals("ENCODED_PASSWORD", created.getPassword());
        assertEquals("USER", created.getRole());
        assertEquals(1, created.getStatus());
        verify(userMapper).insert(any(User.class));
    }
}
