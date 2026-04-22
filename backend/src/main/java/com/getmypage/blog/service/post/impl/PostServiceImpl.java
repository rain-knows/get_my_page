package com.getmypage.blog.service.post.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.getmypage.blog.common.util.SecurityUtils;
import com.getmypage.blog.event.PostPublishedEvent;
import com.getmypage.blog.exception.BizException;
import com.getmypage.blog.exception.ErrorCode;
import com.getmypage.blog.mapper.PostMapper;
import com.getmypage.blog.model.dto.request.PostCreateRequest;
import com.getmypage.blog.model.dto.request.PostUpdateRequest;
import com.getmypage.blog.model.dto.response.PageResponse;
import com.getmypage.blog.model.dto.response.PostDetailResponse;
import com.getmypage.blog.model.dto.response.PostListItemResponse;
import com.getmypage.blog.model.entity.Post;
import com.getmypage.blog.service.post.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 文章服务实现。
 */
@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private static final String GMP_BLOCK_V1_FORMAT = "gmp-block-v1";
    private static final int MAX_PAGE_SIZE = 50;

    private final PostMapper postMapper;
    private final SecurityUtils securityUtils;
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;

    /**
     * 功能：分页查询文章列表，并根据 includeDraft 与角色能力决定是否可见草稿。
     * 关键参数：page 为页码；size 为每页大小；includeDraft 为请求是否包含草稿。
     * 返回值/副作用：返回分页响应；无副作用。
     */
    @Override
    public PageResponse<PostListItemResponse> listPosts(int page, int size, boolean includeDraft) {
        int normalizedPage = Math.max(page, 1);
        int normalizedSize = normalizePageSize(size);
        boolean allowDraft = includeDraft && securityUtils.isAdmin();
        long offset = (long) (normalizedPage - 1) * normalizedSize;

        List<Post> records = postMapper.selectPostPage(offset, normalizedSize, allowDraft);
        long total = postMapper.countPosts(allowDraft);
        long pages = total == 0 ? 0 : (total + normalizedSize - 1) / normalizedSize;

        List<PostListItemResponse> items = records.stream()
                .map(this::mapToListItem)
                .toList();

        return PageResponse.<PostListItemResponse>builder()
                .records(items)
                .current(normalizedPage)
                .size(normalizedSize)
                .total(total)
                .pages(pages)
                .build();
    }

    /**
     * 功能：按 slug 查询文章详情，并根据 includeDraft 与角色能力决定是否可见草稿。
     * 关键参数：slug 为文章唯一标识；includeDraft 为请求是否包含草稿。
     * 返回值/副作用：返回文章详情；未命中时抛出资源不存在异常。
     */
    @Override
    public PostDetailResponse getPostDetail(String slug, boolean includeDraft) {
        if (!StringUtils.hasText(slug)) {
            throw new BizException(ErrorCode.BAD_REQUEST, "slug 不能为空");
        }
        boolean allowDraft = includeDraft && securityUtils.isAdmin();
        Post post = postMapper.findDetailBySlug(slug.trim(), allowDraft);
        if (post == null) {
            throw new BizException(ErrorCode.NOT_FOUND, "文章不存在");
        }
        return mapToDetail(post);
    }

    /**
     * 功能：创建文章，执行管理员权限、slug 冲突与字段语义校验后入库。
     * 关键参数：request 为创建请求。
     * 返回值/副作用：返回新建文章详情；副作用为写库并发布文章变更事件。
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public PostDetailResponse createPost(PostCreateRequest request) {
        ensureAdminWritable();
        validatePostStatus(request.getStatus());
        validateContentFormat(request.getContentFormat());
        validateGmpBlockContent(request.getContent());
        ensureSlugUnique(request.getSlug(), null);

        Post post = new Post();
        post.setTitle(request.getTitle().trim());
        post.setSlug(request.getSlug().trim());
        post.setSummary(resolveExcerpt(request.getExcerpt(), request.getSummary(), request.getContent()));
        post.setContent(request.getContent());
        post.setCoverUrl(request.getCoverUrl());
        post.setStatus(request.getStatus());
        post.setAllowComment(1);
        post.setAuthorId(resolveCurrentUserId());
        post.setIsTop(0);
        post.setViewCount(0);
        post.setLikeCount(0);

        postMapper.insert(post);
        Post created = postMapper.selectById(post.getId());
        publishPostChangedEvent(created.getId(), created.getStatus(), false);
        return mapToDetail(created);
    }

    /**
     * 功能：更新文章，支持 baseUpdatedAt 可选冲突检测并统一触发一致性事件。
     * 关键参数：postId 为文章 ID；request 为更新请求。
     * 返回值/副作用：返回更新后的文章详情；副作用为写库并发布文章变更事件。
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public PostDetailResponse updatePost(Long postId, PostUpdateRequest request) {
        ensureAdminWritable();
        validatePostStatus(request.getStatus());
        validateContentFormat(request.getContentFormat());
        validateGmpBlockContent(request.getContent());

        Post existing = postMapper.selectById(postId);
        if (existing == null) {
            throw new BizException(ErrorCode.NOT_FOUND, "文章不存在");
        }

        validateBaseUpdatedAt(request.getBaseUpdatedAt(), existing.getUpdatedAt());
        ensureSlugUnique(request.getSlug(), postId);

        existing.setTitle(request.getTitle().trim());
        existing.setSlug(request.getSlug().trim());
        existing.setSummary(resolveExcerpt(request.getExcerpt(), request.getSummary(), request.getContent()));
        existing.setContent(request.getContent());
        existing.setCoverUrl(request.getCoverUrl());
        existing.setStatus(request.getStatus());

        postMapper.updateById(existing);

        Post updated = postMapper.selectById(postId);
        publishPostChangedEvent(updated.getId(), updated.getStatus(), false);
        return mapToDetail(updated);
    }

    /**
     * 功能：删除文章并发布用于缓存与索引清理的文章变更事件。
     * 关键参数：postId 为文章 ID。
     * 返回值/副作用：无返回值；副作用为逻辑删除文章并发布文章变更事件。
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deletePost(Long postId) {
        ensureAdminWritable();

        Post existing = postMapper.selectById(postId);
        if (existing == null) {
            throw new BizException(ErrorCode.NOT_FOUND, "文章不存在");
        }

        postMapper.deleteById(postId);
        publishPostChangedEvent(postId, existing.getStatus(), true);
    }

    /**
     * 功能：统一执行文章写操作管理员权限校验。
     * 关键参数：无。
     * 返回值/副作用：无返回值；未通过时抛出无权限业务异常。
     */
    private void ensureAdminWritable() {
        if (!securityUtils.isAdmin()) {
            throw new BizException(ErrorCode.FORBIDDEN, "无权限访问");
        }
    }

    /**
     * 功能：将 Post 实体映射为列表项响应，统一输出 excerpt/summary 与 baseUpdatedAt 语义。
     * 关键参数：post 为文章实体。
     * 返回值/副作用：返回列表项 DTO；无副作用。
     */
    private PostListItemResponse mapToListItem(Post post) {
        String excerpt = resolveExcerpt(post.getSummary(), post.getSummary(), post.getContent());
        return PostListItemResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .slug(post.getSlug())
                .excerpt(excerpt)
                .summary(excerpt)
                .contentFormat(GMP_BLOCK_V1_FORMAT)
                .status(post.getStatus())
                .coverUrl(post.getCoverUrl())
                .updatedAt(post.getUpdatedAt())
                .baseUpdatedAt(post.getUpdatedAt())
                .build();
    }

    /**
     * 功能：将 Post 实体映射为详情响应，统一输出 excerpt/summary 与 baseUpdatedAt 语义。
     * 关键参数：post 为文章实体。
     * 返回值/副作用：返回详情 DTO；无副作用。
     */
    private PostDetailResponse mapToDetail(Post post) {
        String excerpt = resolveExcerpt(post.getSummary(), post.getSummary(), post.getContent());
        return PostDetailResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .slug(post.getSlug())
                .excerpt(excerpt)
                .summary(excerpt)
                .content(post.getContent())
                .contentFormat(GMP_BLOCK_V1_FORMAT)
                .status(post.getStatus())
                .coverUrl(post.getCoverUrl())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .baseUpdatedAt(post.getUpdatedAt())
                .build();
    }

    /**
     * 功能：校验文章状态字段仅允许草稿或发布态。
     * 关键参数：status 为请求中的文章状态。
     * 返回值/副作用：无返回值；非法状态时抛出参数异常。
     */
    private void validatePostStatus(Integer status) {
        if (status == null || (status != 0 && status != 1)) {
            throw new BizException(ErrorCode.BAD_REQUEST, "status 仅支持 0(草稿) 或 1(发布)");
        }
    }

    /**
     * 功能：校验 contentFormat 枚举值合法性，保障内容格式语义一致。
     * 关键参数：contentFormat 为请求中的内容格式，可为空。
     * 返回值/副作用：无返回值；非法格式时抛出参数异常。
     */
    private void validateContentFormat(String contentFormat) {
        if (!StringUtils.hasText(contentFormat)) {
            throw new BizException(ErrorCode.BAD_REQUEST, "contentFormat 必填且仅支持 gmp-block-v1");
        }
        String normalized = contentFormat.trim();
        if (!GMP_BLOCK_V1_FORMAT.equals(normalized)) {
            throw new BizException(ErrorCode.BAD_REQUEST, "contentFormat 仅支持 gmp-block-v1");
        }
    }

    /**
     * 功能：校验正文是否符合 gmp-block-v1 块协议结构，避免旧格式继续写入。
     * 关键参数：content 为请求中的正文 JSON 字符串。
     * 返回值/副作用：无返回值；结构不合法时抛出参数异常。
     */
    private void validateGmpBlockContent(String content) {
        if (!StringUtils.hasText(content)) {
            throw new BizException(ErrorCode.BAD_REQUEST, "content 不能为空");
        }

        try {
            JsonNode root = objectMapper.readTree(content);
            if (root == null || !root.isObject()) {
                throw new BizException(ErrorCode.BAD_REQUEST, "content 必须是 gmp-block-v1 JSON 对象");
            }

            String version = root.path("version").asText("");
            if (!GMP_BLOCK_V1_FORMAT.equals(version)) {
                throw new BizException(ErrorCode.BAD_REQUEST, "content.version 必须为 gmp-block-v1");
            }

            JsonNode blocks = root.path("blocks");
            if (!blocks.isArray()) {
                throw new BizException(ErrorCode.BAD_REQUEST, "content.blocks 必须为数组");
            }
        } catch (BizException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new BizException(ErrorCode.BAD_REQUEST, "content 不是合法 JSON");
        }
    }

    /**
     * 功能：执行 slug 唯一性校验，在更新场景下允许命中自身记录。
     * 关键参数：slug 为目标 slug；currentPostId 为当前文章 ID，创建场景传 null。
     * 返回值/副作用：无返回值；冲突时抛出 40901 业务异常。
     */
    private void ensureSlugUnique(String slug, Long currentPostId) {
        if (!StringUtils.hasText(slug)) {
            throw new BizException(ErrorCode.BAD_REQUEST, "slug 不能为空");
        }
        Post existing = postMapper.findBySlug(slug.trim());
        if (existing == null) {
            return;
        }
        if (currentPostId != null && currentPostId.equals(existing.getId())) {
            return;
        }
        throw new BizException(ErrorCode.CONFLICT, "slug 已存在");
    }

    /**
     * 功能：在请求提供 baseUpdatedAt 时执行乐观冲突检测，不提供则保持兼容直接更新。
     * 关键参数：baseUpdatedAt 为请求基线时间；currentUpdatedAt 为数据库当前更新时间。
     * 返回值/副作用：无返回值；冲突时抛出 40901 业务异常。
     */
    private void validateBaseUpdatedAt(LocalDateTime baseUpdatedAt, LocalDateTime currentUpdatedAt) {
        if (baseUpdatedAt == null) {
            return;
        }
        if (currentUpdatedAt == null || !currentUpdatedAt.isEqual(baseUpdatedAt)) {
            throw new BizException(ErrorCode.CONFLICT, "文章已被其他人更新，请刷新后重试");
        }
    }

    /**
     * 功能：统一解析摘要语义，优先 excerpt，再兼容 summary，最后从 content 自动提取。
     * 关键参数：excerpt 为新字段输入；summary 为兼容字段输入；content 为正文。
     * 返回值/副作用：返回最终摘要文本；无副作用。
     */
    private String resolveExcerpt(String excerpt, String summary, String content) {
        if (StringUtils.hasText(excerpt)) {
            return excerpt.trim();
        }
        if (StringUtils.hasText(summary)) {
            return summary.trim();
        }
        return extractExcerptFromContent(content);
    }

    /**
     * 功能：从正文中提取默认摘要，作为 excerpt 缺省值。
     * 关键参数：content 为正文内容。
     * 返回值/副作用：返回最多 140 字符的摘要文本；无副作用。
     */
    private String extractExcerptFromContent(String content) {
        if (!StringUtils.hasText(content)) {
            return "";
        }
        String fromBlocks = extractExcerptFromGmpBlockContent(content);
        if (StringUtils.hasText(fromBlocks)) {
            return fromBlocks;
        }
        String normalized = content
                .replaceAll("[#*`>\\[\\]{}()_~-]", " ")
                .replaceAll("\\s+", " ")
                .trim();
        if (normalized.length() <= 140) {
            return normalized;
        }
        return normalized.substring(0, 140);
    }

    /**
     * 功能：从 gmp-block-v1 正文中提取摘要文本，优先使用块文本而非原始 JSON 串。
     * 关键参数：content 为正文 JSON 字符串。
     * 返回值/副作用：返回摘要文本；解析失败或无文本时返回空字符串。
     */
    private String extractExcerptFromGmpBlockContent(String content) {
        if (!StringUtils.hasText(content)) {
            return "";
        }

        try {
            JsonNode root = objectMapper.readTree(content);
            if (!root.isObject() || !GMP_BLOCK_V1_FORMAT.equals(root.path("version").asText())) {
                return "";
            }

            JsonNode blocks = root.path("blocks");
            if (!blocks.isArray()) {
                return "";
            }

            StringBuilder excerptBuilder = new StringBuilder();
            for (JsonNode block : blocks) {
                if (!block.isObject()) {
                    continue;
                }
                appendBlockText(excerptBuilder, extractBlockPreviewText(block));
                if (excerptBuilder.length() >= 140) {
                    break;
                }
            }

            String normalized = excerptBuilder.toString().replaceAll("\\s+", " ").trim();
            if (!StringUtils.hasText(normalized)) {
                return "";
            }
            if (normalized.length() <= 140) {
                return normalized;
            }
            return normalized.substring(0, 140);
        } catch (Exception ignored) {
            return "";
        }
    }

    /**
     * 功能：按块类型提取可用于摘要的文本，兼容 gmp-block-v1 新旧字段形态。
     * 关键参数：block 为单个正文块节点。
     * 返回值/副作用：返回块文本，缺失时返回空字符串。
     */
    private String extractBlockPreviewText(JsonNode block) {
        String type = block.path("type").asText("");
        if ("paragraph".equals(type) || "heading".equals(type) || "quote".equals(type)) {
            String richTextValue = extractRichTextPlain(block.path("richText"));
            return StringUtils.hasText(richTextValue) ? richTextValue : block.path("text").asText("");
        }
        if ("list".equals(type)) {
            StringBuilder listBuilder = new StringBuilder();
            JsonNode items = block.path("items");
            if (items.isArray()) {
                for (JsonNode item : items) {
                    String itemText = item.isArray() ? extractRichTextPlain(item) : item.asText("");
                    appendBlockText(listBuilder, itemText);
                }
            }
            return listBuilder.toString();
        }
        if ("code".equals(type)) {
            String code = block.path("code").asText("");
            return StringUtils.hasText(code) ? code : block.path("text").asText("");
        }
        if ("image".equals(type)) {
            String caption = block.path("caption").asText("");
            return StringUtils.hasText(caption) ? caption : block.path("alt").asText("");
        }
        if ("embed".equals(type)) {
            JsonNode snapshot = block.path("snapshot");
            String title = snapshot.path("title").asText("");
            return StringUtils.hasText(title) ? title : block.path("url").asText("");
        }
        return block.path("text").asText("");
    }

    /**
     * 功能：将 richText 数组拼接为纯文本，供摘要构造复用。
     * 关键参数：richTextArray 为块协议 richText 数组。
     * 返回值/副作用：返回纯文本字符串；无副作用。
     */
    private String extractRichTextPlain(JsonNode richTextArray) {
        if (!richTextArray.isArray()) {
            return "";
        }
        StringBuilder textBuilder = new StringBuilder();
        for (JsonNode segment : richTextArray) {
            String text = segment.path("text").asText("");
            if (StringUtils.hasText(text)) {
                textBuilder.append(text);
            }
        }
        return textBuilder.toString();
    }

    /**
     * 功能：向摘要构造器追加文本片段并保持空格分隔，避免内容拼接粘连。
     * 关键参数：builder 为摘要构造器；text 为待追加文本。
     * 返回值/副作用：无返回值；副作用为修改 builder 内容。
     */
    private void appendBlockText(StringBuilder builder, String text) {
        if (!StringUtils.hasText(text)) {
            return;
        }
        if (builder.length() > 0) {
            builder.append(' ');
        }
        builder.append(text.trim());
    }

    /**
     * 功能：将分页大小约束在合法范围内，避免极端请求影响稳定性。
     * 关键参数：size 为请求分页大小。
     * 返回值/副作用：返回归一化后的分页大小；无副作用。
     */
    private int normalizePageSize(int size) {
        if (size <= 0) {
            return 10;
        }
        return Math.min(size, MAX_PAGE_SIZE);
    }

    /**
     * 功能：解析当前登录用户 ID，用于创建文章作者归属。
     * 关键参数：无。
     * 返回值/副作用：返回当前用户 ID；解析失败时抛出无权限异常。
     */
    private Long resolveCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new BizException(ErrorCode.FORBIDDEN, "无权限访问");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof Number number) {
            return number.longValue();
        }
        throw new BizException(ErrorCode.FORBIDDEN, "无权限访问");
    }

    /**
     * 功能：发布文章变更事件，驱动缓存失效、列表版本递增与搜索索引同步。
     * 关键参数：postId 为文章 ID；status 为文章状态；deleted 为是否删除。
     * 返回值/副作用：无返回值；副作用为向 Spring 事件总线发布事件。
     */
    private void publishPostChangedEvent(Long postId, Integer status, boolean deleted) {
        eventPublisher.publishEvent(new PostPublishedEvent(this, postId, status, deleted));
    }
}
