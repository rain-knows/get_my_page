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

    private static final String TARGET_CONTENT_FORMAT = "gmp-block-v1";
    private static final int TARGET_MIGRATION_VERSION = 1;

    private final PostMapper postMapper;
    private final SecurityUtils securityUtils;
    private final ObjectMapper objectMapper;

    /**
     * 功能：将历史文章正文批量迁移为 gmp-block-v1 块协议，并返回完整迁移统计与失败明细。
     * 关键参数：无。
     * 返回值/副作用：返回迁移报告；副作用为批量更新 post.content 字段。
     */
    @Override
    public PostContentMigrationReportResponse migrateAllPostsToGmpBlockV1() {
        ensureAdminWritable();

        List<Post> posts = postMapper.selectList(new LambdaQueryWrapper<>());
        int migrated = 0;
        int skipped = 0;
        List<PostContentMigrationReportResponse.FailedItem> failedItems = new ArrayList<>();

        for (Post post : posts) {
            try {
                if (isGmpBlockV1Content(post.getContent())) {
                    skipped++;
                    continue;
                }

                String migratedContent = convertLegacyContentToGmpBlockContent(post.getContent());
                post.setContent(migratedContent);
                postMapper.updateById(post);
                migrated++;
            } catch (Exception exception) {
                failedItems.add(PostContentMigrationReportResponse.FailedItem.builder()
                        .postId(post.getId())
                        .slug(post.getSlug())
                        .reason(exception.getMessage())
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
     * 功能：将单篇旧正文转换为 gmp-block-v1 JSON 字符串，自动识别 tiptap-json 与 mdx 语义。
     * 关键参数：legacyContent 为旧正文内容。
     * 返回值/副作用：返回新协议 JSON 字符串；转换失败时抛出参数异常。
     */
    private String convertLegacyContentToGmpBlockContent(String legacyContent) {
        if (!StringUtils.hasText(legacyContent)) {
            return buildGmpBlockDocument("empty", objectMapper.createArrayNode());
        }

        String trimmed = legacyContent.trim();
        if (looksLikeTiptapDocument(trimmed)) {
            ArrayNode blocks = convertTiptapDocumentToBlocks(trimmed);
            return buildGmpBlockDocument("tiptap-json", blocks);
        }

        ArrayNode blocks = convertMdxLikeContentToBlocks(trimmed);
        return buildGmpBlockDocument("mdx", blocks);
    }

    /**
     * 功能：判断正文是否已是目标 gmp-block-v1 协议，避免重复迁移同一文章。
     * 关键参数：content 为文章正文。
     * 返回值/副作用：返回布尔值；无副作用。
     */
    private boolean isGmpBlockV1Content(String content) {
        if (!StringUtils.hasText(content)) {
            return false;
        }
        try {
            JsonNode root = objectMapper.readTree(content);
            return root.isObject() && TARGET_CONTENT_FORMAT.equals(root.path("version").asText(""));
        } catch (Exception ignored) {
            return false;
        }
    }

    /**
     * 功能：判断正文是否为 tiptap 文档 JSON，以便走 tiptap 到块模型的转换链路。
     * 关键参数：content 为正文字符串。
     * 返回值/副作用：返回布尔值；无副作用。
     */
    private boolean looksLikeTiptapDocument(String content) {
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
     * 功能：将 mdx 文本按块拆分并映射为 gmp-block-v1 的基础块类型。
     * 关键参数：content 为 mdx 字符串。
     * 返回值/副作用：返回块数组；无副作用。
     */
    private ArrayNode convertMdxLikeContentToBlocks(String content) {
        ArrayNode blocks = objectMapper.createArrayNode();
        String[] paragraphs = content.split("\\n{2,}");

        for (String paragraph : paragraphs) {
            String normalized = paragraph.trim();
            if (!StringUtils.hasText(normalized)) {
                continue;
            }

            if (normalized.startsWith("```") && normalized.endsWith("```")) {
                blocks.add(buildCodeBlockNode(normalized));
                continue;
            }
            if (normalized.startsWith("# ")) {
                blocks.add(buildHeadingBlockNode(1, normalized.substring(2).trim()));
                continue;
            }
            if (normalized.startsWith("## ")) {
                blocks.add(buildHeadingBlockNode(2, normalized.substring(3).trim()));
                continue;
            }
            if (normalized.startsWith("### ")) {
                blocks.add(buildHeadingBlockNode(3, normalized.substring(4).trim()));
                continue;
            }
            if (normalized.startsWith("> ")) {
                blocks.add(buildQuoteBlockNode(normalized.replaceAll("(?m)^>\\s*", "").trim()));
                continue;
            }
            if (normalized.startsWith("- ")) {
                blocks.add(buildListBlockNode("bullet", parseListItems(normalized, "- ")));
                continue;
            }
            if (normalized.matches("(?s)^\\d+\\.\\s+.*")) {
                blocks.add(buildListBlockNode("ordered", parseOrderedListItems(normalized)));
                continue;
            }
            blocks.add(buildParagraphBlockNode(normalized));
        }

        if (blocks.isEmpty()) {
            blocks.add(buildParagraphBlockNode(""));
        }
        return blocks;
    }

    /**
     * 功能：将 tiptap 文档 JSON 转换为 gmp-block-v1 块数组，覆盖首期基础块与嵌入卡片块。
     * 关键参数：tiptapJson 为 tiptap 文档字符串。
     * 返回值/副作用：返回块数组；解析失败时抛出参数异常。
     */
    private ArrayNode convertTiptapDocumentToBlocks(String tiptapJson) {
        try {
            JsonNode root = objectMapper.readTree(tiptapJson);
            ArrayNode nodes = (ArrayNode) root.path("content");
            ArrayNode blocks = objectMapper.createArrayNode();

            for (JsonNode node : nodes) {
                String type = node.path("type").asText("");
                switch (type) {
                    case "paragraph" -> blocks.add(buildParagraphBlockNode(extractTextFromTiptapNode(node.path("content"))));
                    case "heading" -> blocks.add(buildHeadingBlockNode(node.path("attrs").path("level").asInt(2), extractTextFromTiptapNode(node.path("content"))));
                    case "bulletList" -> blocks.add(buildListBlockNode("bullet", extractListItemsFromTiptapNode(node.path("content"))));
                    case "orderedList" -> blocks.add(buildListBlockNode("ordered", extractListItemsFromTiptapNode(node.path("content"))));
                    case "blockquote" -> blocks.add(buildQuoteBlockNode(extractTextFromTiptapNode(node.path("content"))));
                    case "codeBlock" -> blocks.add(buildCodeBlockNodeFromTiptap(node));
                    case "horizontalRule", "divider" -> blocks.add(buildDividerBlockNode());
                    case "image", "imageBlock" -> blocks.add(buildImageBlockNode(node.path("attrs")));
                    case "embedGithub" -> blocks.add(buildEmbedBlockNode("github", node.path("attrs")));
                    case "embedMusic" -> blocks.add(buildEmbedBlockNode("music", node.path("attrs")));
                    case "embedVideo" -> blocks.add(buildEmbedBlockNode("video", node.path("attrs")));
                    case "embedLink" -> blocks.add(buildEmbedBlockNode("link", node.path("attrs")));
                    default -> {
                        String fallbackText = extractTextFromTiptapNode(node.path("content"));
                        if (StringUtils.hasText(fallbackText)) {
                            blocks.add(buildParagraphBlockNode(fallbackText));
                        }
                    }
                }
            }

            if (blocks.isEmpty()) {
                blocks.add(buildParagraphBlockNode(""));
            }
            return blocks;
        } catch (Exception exception) {
            throw new BizException(ErrorCode.BAD_REQUEST, "tiptap-json 迁移失败");
        }
    }

    /**
     * 功能：构建 gmp-block-v1 文档字符串并写入迁移元数据（版本、来源、时间）。
     * 关键参数：sourceFormat 为迁移来源格式；blocks 为目标块数组。
     * 返回值/副作用：返回序列化后的 JSON 字符串；序列化失败时抛出参数异常。
     */
    private String buildGmpBlockDocument(String sourceFormat, ArrayNode blocks) {
        try {
            ObjectNode root = objectMapper.createObjectNode();
            root.put("version", TARGET_CONTENT_FORMAT);
            ObjectNode meta = root.putObject("meta");
            meta.put("migrationVersion", TARGET_MIGRATION_VERSION);
            meta.put("sourceFormat", sourceFormat);
            meta.put("migratedAt", OffsetDateTime.now().toString());
            root.set("blocks", blocks);
            return objectMapper.writeValueAsString(root);
        } catch (Exception exception) {
            throw new BizException(ErrorCode.BAD_REQUEST, "构建 gmp-block-v1 文档失败");
        }
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
     * 功能：从 tiptap 列表节点中提取文本列表项，用于构建 gmp-block-v1 list 块。
     * 关键参数：listItemsNode 为 tiptap listItem 节点数组。
     * 返回值/副作用：返回列表项数组；无副作用。
     */
    private ArrayNode extractListItemsFromTiptapNode(JsonNode listItemsNode) {
        ArrayNode items = objectMapper.createArrayNode();
        if (!listItemsNode.isArray()) {
            return items;
        }

        for (JsonNode listItem : listItemsNode) {
            String itemText = extractTextFromTiptapNode(listItem.path("content"));
            if (StringUtils.hasText(itemText)) {
                items.add(itemText);
            }
        }
        return items;
    }

    /**
     * 功能：递归提取 tiptap 节点文本内容，作为块迁移时的纯文本兜底。
     * 关键参数：node 为 tiptap 节点或节点数组。
     * 返回值/副作用：返回拼接后的文本；无副作用。
     */
    private String extractTextFromTiptapNode(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return "";
        }
        if (node.isArray()) {
            StringBuilder builder = new StringBuilder();
            for (JsonNode child : node) {
                String text = extractTextFromTiptapNode(child);
                if (!StringUtils.hasText(text)) {
                    continue;
                }
                if (builder.length() > 0) {
                    builder.append(' ');
                }
                builder.append(text.trim());
            }
            return builder.toString();
        }
        if (node.has("text")) {
            return node.path("text").asText("");
        }
        if (node.has("content")) {
            return extractTextFromTiptapNode(node.path("content"));
        }
        return "";
    }

    /**
     * 功能：构建段落块节点。
     * 关键参数：text 为段落文本。
     * 返回值/副作用：返回段落块对象；无副作用。
     */
    private ObjectNode buildParagraphBlockNode(String text) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", "paragraph");
        node.set("richText", buildPlainRichTextArray(text));
        return node;
    }

    /**
     * 功能：构建标题块节点。
     * 关键参数：level 为标题等级；text 为标题文本。
     * 返回值/副作用：返回标题块对象；无副作用。
     */
    private ObjectNode buildHeadingBlockNode(int level, String text) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", "heading");
        node.put("level", Math.min(Math.max(level, 1), 3));
        node.set("richText", buildPlainRichTextArray(text));
        return node;
    }

    /**
     * 功能：构建列表块节点。
     * 关键参数：style 为列表样式（bullet/ordered）；items 为列表项数组。
     * 返回值/副作用：返回列表块对象；无副作用。
     */
    private ObjectNode buildListBlockNode(String style, ArrayNode items) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", "list");
        node.put("style", style);
        ArrayNode richTextItems = objectMapper.createArrayNode();
        for (JsonNode item : items) {
            if (item.isArray()) {
                richTextItems.add(item);
                continue;
            }
            richTextItems.add(buildPlainRichTextArray(item.asText("")));
        }
        node.set("items", richTextItems);
        return node;
    }

    /**
     * 功能：构建引用块节点。
     * 关键参数：text 为引用文本。
     * 返回值/副作用：返回引用块对象；无副作用。
     */
    private ObjectNode buildQuoteBlockNode(String text) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", "quote");
        node.set("richText", buildPlainRichTextArray(text));
        return node;
    }

    /**
     * 功能：从 mdx 代码块文本构建代码块节点。
     * 关键参数：content 为包含 ``` 包裹的代码文本。
     * 返回值/副作用：返回代码块对象；无副作用。
     */
    private ObjectNode buildCodeBlockNode(String content) {
        String normalized = content.trim();
        String[] lines = normalized.split("\\n");
        String firstLine = lines.length > 0 ? lines[0] : "```";
        String language = firstLine.replace("```", "").trim().toLowerCase(Locale.ROOT);
        String codeText = normalized
                .replaceFirst("^```\\w*\\n?", "")
                .replaceFirst("```$", "")
                .trim();

        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", "code");
        node.put("language", language);
        node.put("code", codeText);
        return node;
    }

    /**
     * 功能：从 tiptap codeBlock 节点构建代码块对象。
     * 关键参数：node 为 tiptap codeBlock 节点。
     * 返回值/副作用：返回代码块对象；无副作用。
     */
    private ObjectNode buildCodeBlockNodeFromTiptap(JsonNode node) {
        ObjectNode blockNode = objectMapper.createObjectNode();
        blockNode.put("type", "code");
        blockNode.put("language", node.path("attrs").path("language").asText(""));
        blockNode.put("code", extractTextFromTiptapNode(node.path("content")));
        return blockNode;
    }

    /**
     * 功能：构建仅含纯文本片段的 richText 数组，供 paragraph/heading/quote/list 统一复用。
     * 关键参数：text 为纯文本内容。
     * 返回值/副作用：返回 richText 数组；无副作用。
     */
    private ArrayNode buildPlainRichTextArray(String text) {
        ArrayNode richTextArray = objectMapper.createArrayNode();
        ObjectNode textSegment = objectMapper.createObjectNode();
        textSegment.put("text", text);
        richTextArray.add(textSegment);
        return richTextArray;
    }

    /**
     * 功能：从 tiptap 图片节点构建 image 块对象。
     * 关键参数：attrs 为 tiptap 图片 attrs。
     * 返回值/副作用：返回图片块对象；无副作用。
     */
    private ObjectNode buildImageBlockNode(JsonNode attrs) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", "image");
        node.put("url", attrs.path("src").asText(""));
        node.put("alt", attrs.path("alt").asText(""));
        node.put("caption", attrs.path("caption").asText(""));
        return node;
    }

    /**
     * 功能：从 tiptap 嵌入节点构建统一 embed 块对象，保留卡片类型、链接与 snapshot。
     * 关键参数：cardType 为目标卡片类型；attrs 为 tiptap 嵌入 attrs。
     * 返回值/副作用：返回嵌入块对象；无副作用。
     */
    private ObjectNode buildEmbedBlockNode(String cardType, JsonNode attrs) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", "embed");
        node.put("cardType", cardType);
        node.put("provider", attrs.path("provider").asText(""));
        String url = attrs.path("url").asText("");
        if (!StringUtils.hasText(url)) {
            url = attrs.path("fallbackUrl").asText("");
        }
        node.put("url", url);
        if (attrs.has("snapshot")) {
            node.set("snapshot", attrs.path("snapshot"));
        } else {
            node.set("snapshot", objectMapper.createObjectNode());
        }
        return node;
    }

    /**
     * 功能：构建分割线块节点。
     * 关键参数：无。
     * 返回值/副作用：返回分割线块对象；无副作用。
     */
    private ObjectNode buildDividerBlockNode() {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", "divider");
        return node;
    }
}
