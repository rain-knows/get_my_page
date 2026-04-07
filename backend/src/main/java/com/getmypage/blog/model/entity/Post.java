package com.getmypage.blog.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 文章实体类。
 * 对应数据库 post 表。
 */
@Data
@TableName("post")
public class Post {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String title;

    private String slug;

    private String summary;

    /** MDX 原始内容 */
    private String content;

    private String coverUrl;

    private Long categoryId;

    private Long authorId;

    /** 状态: 0-草稿 1-已发布 */
    private Integer status;

    /** 是否允许评论: 0-关闭 1-开启 */
    private Integer allowComment;

    private Integer viewCount;

    private Integer likeCount;

    /** 是否置顶 */
    private Integer isTop;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
