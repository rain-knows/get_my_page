package com.getmypage.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.getmypage.blog.model.entity.Post;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 文章 Mapper 接口。
 */
public interface PostMapper extends BaseMapper<Post> {

    /**
     * 功能：根据 slug 查询未删除文章，用于唯一性校验与详情读取。
     * 关键参数：slug 为文章唯一标识。
     * 返回值/副作用：返回匹配文章实体，未命中时返回 null；无副作用。
     */
    Post findBySlug(@Param("slug") String slug);

    /**
     * 功能：分页查询文章列表，并按 includeDraft 控制是否包含草稿。
     * 关键参数：offset 为偏移量；size 为分页大小；includeDraft 为是否包含草稿。
     * 返回值/副作用：返回文章列表；无副作用。
     */
    List<Post> selectPostPage(@Param("offset") long offset,
                              @Param("size") long size,
                              @Param("includeDraft") boolean includeDraft);

    /**
     * 功能：统计文章总数，并按 includeDraft 控制是否包含草稿。
     * 关键参数：includeDraft 为是否包含草稿。
     * 返回值/副作用：返回总记录数；无副作用。
     */
    long countPosts(@Param("includeDraft") boolean includeDraft);

    /**
     * 功能：按 slug 查询文章详情，并按 includeDraft 控制草稿可见性。
     * 关键参数：slug 为文章唯一标识；includeDraft 为是否允许草稿。
     * 返回值/副作用：返回文章实体，未命中时返回 null；无副作用。
     */
    Post findDetailBySlug(@Param("slug") String slug,
                          @Param("includeDraft") boolean includeDraft);

    /**
     * 功能：在 MySQL 中执行公开文章模糊检索，作为搜索降级兜底。
     * 关键参数：keyword 为关键词；limit 为最多返回条数。
     * 返回值/副作用：返回命中文章列表（仅 status=1）；无副作用。
     */
    List<Post> searchPublishedByKeyword(@Param("keyword") String keyword,
                                        @Param("limit") int limit);
}
