package com.getmypage.blog.service.post.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.getmypage.blog.common.util.SecurityUtils;
import com.getmypage.blog.exception.BizException;
import com.getmypage.blog.exception.ErrorCode;
import com.getmypage.blog.mapper.PostMapper;
import com.getmypage.blog.model.dto.response.PostContentMigrationReportResponse;
import com.getmypage.blog.model.entity.Post;
import com.getmypage.blog.service.post.PostContentMigrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * 文章正文迁移服务实现。
 */
@Service
@RequiredArgsConstructor
public class PostContentMigrationServiceImpl implements PostContentMigrationService {

    private static final String TARGET_CONTENT_FORMAT = "tiptap-json";
    private static final int TARGET_MIGRATION_VERSION = 2;

    private final PostMapper postMapper;
    private final SecurityUtils securityUtils;
    private final ObjectMapper objectMapper;

    /**
     * 功能：将历史文章正文批量迁移为 tiptap-json 协议，并返回完整迁移统计与失败明细。
     * 关键参数：无。
     * 返回值/副作用：返回迁移报告；副作用为批量更新 post.content 字段。
     */
    @Override
    public PostContentMigrationReportResponse migrateAllPostsToTiptapJson() {
        ensureAdminWritable();

        List<Post> posts = postMapper.selectList(new LambdaQueryWrapper<>());
        int migrated = 0;
        int skipped = 0;
        List<PostContentMigrationReportResponse.FailedItem> failedItems = new ArrayList<>();

        for (Post post : posts) {
            try {
                if (isTiptapJsonContent(post.getContent())) {
                    skipped++;
                    continue;
                }

                String migratedContent = convertLegacyContentToTiptapJsonContent(post.getContent());
                post.setContent(migratedContent);
                postMapper.updateById(post);
                migrated++;
            } catch (Exception exception) {
                failedItems.add(PostContentMigrationReportResponse.FailedItem.builder()
                        .postId(post.getId())
                        .slug(post.getSlug())
                        .reason(resolveMigrationFailureReason(exception))
                        .build());
            }
        }

        return PostContentMigrationReportResponse.builder()
                .totalPosts(posts.size())
                .migratedPosts(migrated)
                .skippedPosts(skipped)
                .failedPosts(failedItems.size())
                .failedItems(failedItems)
                .build();
    }

    /**
     * 功能：校验当前请求用户是否具备管理员权限，防止非管理员触发批量迁移。
     * 关键参数：无。
     * 返回值/副作用：无返回值；权限不足时抛出无权限异常。
     */
    private void ensureAdminWritable() {
        if (!securityUtils.isAdmin()) {
            throw new BizException(ErrorCode.FORBIDDEN, "无权限访问");
        }
    }

    /**
     * 功能：提取迁移失败原因文本，确保失败清单可读且稳定。
     * 关键参数：exception 为迁移期间抛出的异常。
     * 返回值/副作用：返回失败原因文本；无副作用。
     */
    private String resolveMigrationFailureReason(Exception exception) {
        if (exception == null) {
            return "未知错误";
        }
        if (StringUtils.hasText(exception.getMessage())) {
            return exception.getMessage();
        }
        return exception.getClass().getSimpleName();
    }

    /**
     * 功能：将单篇旧正文转换为 tiptap-json 字符串，自动识别 gmp-block-v1、mdx 与已是 tiptap 的内容。
     * 关键参数：legacyContent 为旧正文内容。
     * 返回值/副作用：返回新协议 JSON 字符串；转换失败时抛出参数异常。
     */
    private String convertLegacyContentToTiptapJsonContent(String legacyContent) {
        if (!StringUtils.hasText(legacyContent)) {
            return buildTiptapDocument("empty", objectMapper.createArrayNode());
        }

        String trimmed = legacyContent.trim();
        if (looksLikeTiptapDocument(trimmed)) {
            ArrayNode nodes = convertTiptapDocumentToNodes(trimmed);
            return buildTiptapDocument("tiptap-json", nodes);
        }

        if (looksLikeGmpBlockDocument(trimmed)) {
            ArrayNode nodes = convertGmpBlockDocumentToTiptapNodes(trimmed);
            return buildTiptapDocument("gmp-block-v1", nodes);
        }

        ArrayNode nodes = convertMdxLikeContentToTiptapNodes(trimmed);
        return buildTiptapDocument("mdx", nodes);
    }

    /**
     * 功能：判断正文是否已是目标 tiptap-json 协议，避免重复迁移同一文章。
     * 关键参数：content 为文章正文。
     * 返回值/副作用：返回布尔值；无副作用。
     */
    private boolean isTiptapJsonContent(String content) {
        if (!StringUtils.hasText(content)) {
            return false;
        }
        try {
            JsonNode root = objectMapper.readTree(content);
            return root.isObject()
                    && "doc".equals(root.path("type").asText(""))
                    && root.path("content").isArray();
        } catch (Exception ignored) {
            return false;
        }
    }

    /**
     * 功能：判断正文是否为 tiptap 文档 JSON，以便直接走标准化链路。
     * 关键参数：content 为正文字符串。
     * 返回值/副作用：返回布尔值；无副作用。
     */
    private boolean looksLikeTiptapDocument(String content) {
        return isTiptapJsonContent(content);
    }

    /**
     * 功能：判断正文是否为 gmp-block-v1 文档，供一次性硬切迁移识别旧协议。
     * 关键参数：content 为正文字符串。
     * 返回值/副作用：返回布尔值；无副作用。
     */
    private boolean looksLikeGmpBlockDocument(String content) {
        try {
            JsonNode root = objectMapper.readTree(content);
            return root.isObject()
                    && "gmp-block-v1".equals(root.path("version").asText(""))
                    && root.path("blocks").isArray();
        } catch (Exception ignored) {
            return false;
        }
    }

    /**
     * 功能：将已是 tiptap-json 的文档标准化为节点数组，供统一迁移输出附加 meta。
     * 关键参数：content 为 tiptap-json 文本。
     * 返回值/副作用：返回节点数组；解析失败时抛出参数异常。
     */
    private ArrayNode convertTiptapDocumentToNodes(String content) {
        try {
            JsonNode root = objectMapper.readTree(content);
            JsonNode nodes = root.path("content");
            if (!nodes.isArray()) {
                throw new BizException(ErrorCode.BAD_REQUEST, "tiptap-json content 节点缺失");
            }
            return (ArrayNode) nodes;
        } catch (BizException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new BizException(ErrorCode.BAD_REQUEST, "tiptap-json 迁移失败");
        }
    }

    /**
     * 功能：将 gmp-block-v1 文档转换为 tiptap-json 节点数组，覆盖基础文本、图片、分割线与嵌入降级语义。
     * 关键参数：content 为 gmp-block-v1 文本。
     * 返回值/副作用：返回 tiptap 节点数组；解析失败时抛出参数异常。
     */
    private ArrayNode convertGmpBlockDocumentToTiptapNodes(String content) {
        try {
            JsonNode root = objectMapper.readTree(content);
            JsonNode blocks = root.path("blocks");
            if (!blocks.isArray()) {
                throw new BizException(ErrorCode.BAD_REQUEST, "gmp-block-v1 blocks 节点缺失");
            }

            ArrayNode nodes = objectMapper.createArrayNode();
            for (JsonNode block : blocks) {
                if (!block.isObject()) {
                    continue;
                }
                String type = block.path("type").asText("");
                switch (type) {
                    case "paragraph" -> nodes.add(buildParagraphNode(extractGmpInlineText(block.path("richText"), block.path("text").asText(""))));
                    case "heading" -> nodes.add(buildHeadingNode(block.path("level").asInt(2), extractGmpInlineText(block.path("richText"), block.path("text").asText(""))));
                    case "quote" -> nodes.add(buildBlockquoteNode(extractGmpInlineText(block.path("richText"), block.path("text").asText(""))));
                    case "list" -> nodes.add(buildListNode(block.path("style").asText("bullet"), block.path("items")));
                    case "code" -> nodes.add(buildCodeBlockNode(block.path("language").asText(""), block.path("code").asText("")));
                    case "image" -> nodes.add(buildImageNode(block.path("url").asText(""), block.path("alt").asText(""), block.path("caption").asText("")));
                    case "divider" -> nodes.add(buildHorizontalRuleNode());
                    case "embed" -> nodes.add(buildParagraphNode(extractEmbedFallbackText(block)));
                    default -> {
                        String fallback = extractGmpInlineText(block.path("richText"), block.path("text").asText(""));
                        if (StringUtils.hasText(fallback)) {
                            nodes.add(buildParagraphNode(fallback));
                        }
                    }
                }
            }

            if (nodes.isEmpty()) {
                nodes.add(buildParagraphNode(""));
            }
            return nodes;
        } catch (BizException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new BizException(ErrorCode.BAD_REQUEST, "gmp-block-v1 迁移失败");
        }
    }

    /**
     * 功能：将 mdx 文本按段落拆分并映射为 tiptap-json 节点数组。
     * 关键参数：content 为 mdx 字符串。
     * 返回值/副作用：返回 tiptap 节点数组；无副作用。
     */
    private ArrayNode convertMdxLikeContentToTiptapNodes(String content) {
        ArrayNode nodes = objectMapper.createArrayNode();
        String[] paragraphs = content.split("\\n{2,}");

        for (String paragraph : paragraphs) {
            String normalized = paragraph.trim();
            if (!StringUtils.hasText(normalized)) {
                continue;
            }

            if (normalized.startsWith("```") && normalized.endsWith("```")) {
                nodes.add(buildCodeBlockNodeFromMdx(normalized));
                continue;
            }
            if (normalized.startsWith("# ")) {
                nodes.add(buildHeadingNode(1, normalized.substring(2).trim()));
                continue;
            }
            if (normalized.startsWith("## ")) {
                nodes.add(buildHeadingNode(2, normalized.substring(3).trim()));
                continue;
            }
            if (normalized.startsWith("### ")) {
                nodes.add(buildHeadingNode(3, normalized.substring(4).trim()));
                continue;
            }
            if (normalized.startsWith("> ")) {
                nodes.add(buildBlockquoteNode(normalized.replaceAll("(?m)^>\\s*", "").trim()));
                continue;
            }
            if (normalized.startsWith("- ")) {
                nodes.add(buildListNode("bullet", parseListItems(normalized, "- ")));
                continue;
            }
            if (normalized.matches("(?s)^\\d+\\.\\s+.*")) {
                nodes.add(buildListNode("ordered", parseOrderedListItems(normalized)));
                continue;
            }
            nodes.add(buildParagraphNode(normalized));
        }

        if (nodes.isEmpty()) {
            nodes.add(buildParagraphNode(""));
        }
        return nodes;
    }

    /**
     * 功能：构建 tiptap-json 文档字符串并写入迁移元数据（版本、来源、时间）。
     * 关键参数：sourceFormat 为迁移来源格式；nodes 为目标节点数组。
     * 返回值/副作用：返回序列化后的 JSON 字符串；序列化失败时抛出参数异常。
     */
    private String buildTiptapDocument(String sourceFormat, ArrayNode nodes) {
        try {
            ObjectNode root = objectMapper.createObjectNode();
            root.put("type", "doc");
            ObjectNode meta = root.putObject("meta");
            meta.put("migrationVersion", TARGET_MIGRATION_VERSION);
            meta.put("sourceFormat", sourceFormat);
            meta.put("targetFormat", TARGET_CONTENT_FORMAT);
            meta.put("migratedAt", OffsetDateTime.now().toString());
            root.set("content", nodes);
            return objectMapper.writeValueAsString(root);
        } catch (Exception exception) {
            throw new BizException(ErrorCode.BAD_REQUEST, "构建 tiptap-json 文档失败");
        }
    }

    /**
     * 功能：从 gmp 富文本片段或回退文本中提取纯文本。
     * 关键参数：richTextNode 为 richText 数组；fallback 为回退文本。
     * 返回值/副作用：返回纯文本字符串；无副作用。
     */
    private String extractGmpInlineText(JsonNode richTextNode, String fallback) {
        if (richTextNode != null && richTextNode.isArray()) {
            StringBuilder builder = new StringBuilder();
            for (JsonNode segment : richTextNode) {
                String text = segment.path("text").asText("");
                if (StringUtils.hasText(text)) {
                    builder.append(text);
                }
            }
            String merged = builder.toString().trim();
            if (StringUtils.hasText(merged)) {
                return merged;
            }
        }
        return fallback == null ? "" : fallback.trim();
    }

    /**
     * 功能：从 gmp embed 块提取可读回退文本，避免迁移后出现空段落。
     * 关键参数：block 为 embed 块。
     * 返回值/副作用：返回回退文本；无副作用。
     */
    private String extractEmbedFallbackText(JsonNode block) {
        JsonNode snapshot = block.path("snapshot");
        String title = snapshot.path("title").asText("");
        if (StringUtils.hasText(title)) {
            return title;
        }
        String description = snapshot.path("description").asText("");
        if (StringUtils.hasText(description)) {
            return description;
        }
        return block.path("url").asText("");
    }

    /**
     * 功能：将无序列表文本块拆分为列表项字符串集合。
     * 关键参数：content 为列表文本；prefix 为项前缀（如 "- "）。
     * 返回值/副作用：返回列表项数组；无副作用。
     */
    private ArrayNode parseListItems(String content, String prefix) {
        ArrayNode items = objectMapper.createArrayNode();
        String[] lines = content.split("\\n");
        for (String line : lines) {
            String normalized = line.trim();
            if (normalized.startsWith(prefix)) {
                items.add(normalized.substring(prefix.length()).trim());
            }
        }
        return items;
    }

    /**
     * 功能：将有序列表文本块拆分为列表项字符串集合。
     * 关键参数：content 为列表文本。
     * 返回值/副作用：返回列表项数组；无副作用。
     */
    private ArrayNode parseOrderedListItems(String content) {
        ArrayNode items = objectMapper.createArrayNode();
        String[] lines = content.split("\\n");
        for (String line : lines) {
            String normalized = line.trim();
            String item = normalized.replaceFirst("^\\d+\\.\\s+", "").trim();
            if (StringUtils.hasText(item)) {
                items.add(item);
            }
        }
        return items;
    }

    /**
     * 功能：构建段落节点。
     * 关键参数：text 为段落文本。
     * 返回值/副作用：返回段落节点对象；无副作用。
     */
    private ObjectNode buildParagraphNode(String text) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", "paragraph");
        node.set("content", buildTextContent(text));
        return node;
    }

    /**
     * 功能：构建标题节点。
     * 关键参数：level 为标题等级；text 为标题文本。
     * 返回值/副作用：返回标题节点对象；无副作用。
     */
    private ObjectNode buildHeadingNode(int level, String text) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", "heading");
        ObjectNode attrs = node.putObject("attrs");
        attrs.put("level", Math.min(Math.max(level, 1), 3));
        node.set("content", buildTextContent(text));
        return node;
    }

    /**
     * 功能：构建引用节点。
     * 关键参数：text 为引用文本。
     * 返回值/副作用：返回引用节点对象；无副作用。
     */
    private ObjectNode buildBlockquoteNode(String text) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", "blockquote");
        ArrayNode content = objectMapper.createArrayNode();
        content.add(buildParagraphNode(text));
        node.set("content", content);
        return node;
    }

    /**
     * 功能：构建列表节点（有序/无序）。
     * 关键参数：style 为列表样式；itemsNode 为列表项数组。
     * 返回值/副作用：返回列表节点对象；无副作用。
     */
    private ObjectNode buildListNode(String style, JsonNode itemsNode) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", "ordered".equalsIgnoreCase(style) ? "orderedList" : "bulletList");

        ArrayNode content = objectMapper.createArrayNode();
        if (itemsNode != null && itemsNode.isArray()) {
            for (JsonNode item : itemsNode) {
                ObjectNode listItemNode = objectMapper.createObjectNode();
                listItemNode.put("type", "listItem");
                String text = item.isArray() ? extractGmpInlineText(item, "") : item.asText("");
                ArrayNode listItemContent = objectMapper.createArrayNode();
                listItemContent.add(buildParagraphNode(text));
                listItemNode.set("content", listItemContent);
                content.add(listItemNode);
            }
        }

        if (content.isEmpty()) {
            ObjectNode emptyItem = objectMapper.createObjectNode();
            emptyItem.put("type", "listItem");
            ArrayNode emptyContent = objectMapper.createArrayNode();
            emptyContent.add(buildParagraphNode(""));
            emptyItem.set("content", emptyContent);
            content.add(emptyItem);
        }

        node.set("content", content);
        return node;
    }

    /**
     * 功能：构建代码块节点。
     * 关键参数：language 为代码语言；codeText 为代码文本。
     * 返回值/副作用：返回代码块节点对象；无副作用。
     */
    private ObjectNode buildCodeBlockNode(String language, String codeText) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", "codeBlock");
        ObjectNode attrs = node.putObject("attrs");
        attrs.put("language", language);
        node.set("content", buildTextContent(codeText));
        return node;
    }

    /**
     * 功能：从 mdx ``` 代码块构建代码块节点。
     * 关键参数：content 为包含 ``` 包裹的代码文本。
     * 返回值/副作用：返回代码块节点对象；无副作用。
     */
    private ObjectNode buildCodeBlockNodeFromMdx(String content) {
        String normalized = content.trim();
        String[] lines = normalized.split("\\n");
        String firstLine = lines.length > 0 ? lines[0] : "```";
        String language = firstLine.replace("```", "").trim().toLowerCase(Locale.ROOT);
        String codeText = normalized
                .replaceFirst("^```\\w*\\n?", "")
                .replaceFirst("```$", "")
                .trim();
        return buildCodeBlockNode(language, codeText);
    }

    /**
     * 功能：构建图片节点，保留地址与基础可访问性字段。
     * 关键参数：src 为图片地址；alt 为替代文本；caption 为图注。
     * 返回值/副作用：返回图片节点对象；无副作用。
     */
    private ObjectNode buildImageNode(String src, String alt, String caption) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", "image");
        ObjectNode attrs = node.putObject("attrs");
        attrs.put("src", src);
        attrs.put("alt", alt);
        attrs.put("caption", caption);
        return node;
    }

    /**
     * 功能：构建分割线节点。
     * 关键参数：无。
     * 返回值/副作用：返回分割线节点对象；无副作用。
     */
    private ObjectNode buildHorizontalRuleNode() {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", "horizontalRule");
        return node;
    }

    /**
     * 功能：构建 tiptap 文本 content 数组。
     * 关键参数：text 为文本内容。
     * 返回值/副作用：返回文本内容数组；无副作用。
     */
    private ArrayNode buildTextContent(String text) {
        ArrayNode content = objectMapper.createArrayNode();
        ObjectNode textNode = objectMapper.createObjectNode();
        textNode.put("type", "text");
        textNode.put("text", text == null ? "" : text);
        content.add(textNode);
        return content;
    }
}
