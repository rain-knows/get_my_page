package com.getmypage.blog.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 评论实体类。
 * 对应数据库 comment 表。
 */
@Data
@TableName("comment")
public class Comment {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 目标类型 (post, page) */
    private String targetType;

    /** 目标内容的 ID */
    private Long targetId;

    /** 注册用户 ID（游客留空） */
    private Long userId;

    /** 游客昵称 */
    private String guestNickname;

    /** 游客邮箱 */
    private String guestEmail;

    /** 直接父评论 ID */
    private Long parentId;

    /** 根评论 ID */
    private Long rootId;

    /** 评论正文 */
    private String content;

    private String ipAddress;

    private String userAgent;

    /** 状态: 0-待审 1-正常 2-屏蔽 */
    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
