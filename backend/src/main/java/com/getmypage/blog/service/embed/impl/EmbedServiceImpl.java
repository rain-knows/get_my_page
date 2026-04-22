package com.getmypage.blog.service.embed.impl;

import com.getmypage.blog.model.dto.response.EmbedResolveResponse;
import com.getmypage.blog.service.embed.EmbedService;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Embed 解析服务实现。
 */
@Service
public class EmbedServiceImpl implements EmbedService {

    private static final int METADATA_TIMEOUT_MILLIS = 5000;
    private static final String METADATA_USER_AGENT = "Mozilla/5.0 (compatible; GetMyPageBot/1.0; +https://getmypage.com)";

    /**
     * 功能：统一解析输入链接并按平台自动映射为 github/music/video/link 卡片。
     * 关键参数：input 为用户输入的链接或 owner/repo。
     * 返回值/副作用：返回统一解析响应；副作用为可能触发网页元信息抓取请求。
     */
    @Override
    public EmbedResolveResponse resolve(String input) {
        String normalizedInput = normalizeInput(input);
        if (!StringUtils.hasText(normalizedInput)) {
            return buildFallback("link", "unknown", "", "");
        }

        if (looksLikeGithubOwnerRepo(normalizedInput) || isGithubUrl(normalizedInput)) {
            return resolveGithub(normalizedInput);
        }

        String normalizedUrl = ensureUrlScheme(normalizedInput);
        if (!isHttpUrl(normalizedUrl)) {
            return buildFallback("link", "unknown", normalizedInput, normalizedInput);
        }

        if (isMusicUrl(normalizedUrl)) {
            return resolveMusic(normalizedUrl);
        }

        if (isVideoUrl(normalizedUrl)) {
            return resolveVideo(normalizedUrl);
        }

        return resolveLink(normalizedUrl);
    }

    /**
     * 功能：解析 GitHub 链接或 owner/repo 输入，返回标准化仓库卡片快照。
     * 关键参数：input 为原始输入。
     * 返回值/副作用：返回解析响应；副作用为可能触发 GitHub 页面元信息抓取。
     */
    @Override
    public EmbedResolveResponse resolveGithub(String input) {
        String normalized = normalizeInput(input);
        if (!StringUtils.hasText(normalized)) {
            return buildFallback("github", "github", "", "");
        }

        String ownerRepo = extractGithubOwnerRepo(normalized);
        if (!StringUtils.hasText(ownerRepo)) {
            return buildFallback("github", "github", normalized, ensureUrlScheme(normalized));
        }

        String canonicalUrl = "https://github.com/" + ownerRepo;
        LinkMetadata metadata = fetchLinkMetadata(canonicalUrl);

        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("repo", ownerRepo);
        snapshot.put("fullName", ownerRepo);
        snapshot.put("name", ownerRepo.substring(ownerRepo.indexOf('/') + 1));
        snapshot.put("url", canonicalUrl);
        putIfHasText(snapshot, "title", metadata.title());
        putIfHasText(snapshot, "description", metadata.description());
        putIfHasText(snapshot, "coverUrl", metadata.coverUrl());
        putIfHasText(snapshot, "avatarUrl", metadata.coverUrl());

        return buildSuccess("github", "github", canonicalUrl, snapshot);
    }

    /**
     * 功能：解析音乐平台链接并返回音乐卡片快照（含真实标题/描述/封面）。
     * 关键参数：input 为音乐链接。
     * 返回值/副作用：返回解析响应；副作用为可能触发目标页面元信息抓取。
     */
    @Override
    public EmbedResolveResponse resolveMusic(String input) {
        String normalized = ensureUrlScheme(normalizeInput(input));
        if (!isHttpUrl(normalized)) {
            return buildFallback("music", "unknown", normalized, normalized);
        }

        String provider = resolveMusicProvider(normalized);
        if (!StringUtils.hasText(provider)) {
            return buildFallback("music", "unknown", normalized, normalized);
        }

        LinkMetadata metadata = fetchLinkMetadata(normalized);

        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("provider", provider);
        snapshot.put("url", normalized);
        putIfHasText(snapshot, "title", metadata.title());
        putIfHasText(snapshot, "description", metadata.description());
        putIfHasText(snapshot, "coverUrl", metadata.coverUrl());
        putIfHasText(snapshot, "artist", inferArtist(metadata.description()));

        return buildSuccess("music", provider, normalized, snapshot);
    }

    /**
     * 功能：解析视频链接并返回视频卡片快照。
     * 关键参数：url 为标准化视频链接。
     * 返回值/副作用：返回解析响应；副作用为可能触发目标页面元信息抓取。
     */
    private EmbedResolveResponse resolveVideo(String url) {
        String provider = resolveVideoProvider(url);
        String videoId = resolveVideoId(url, provider);
        LinkMetadata metadata = fetchLinkMetadata(url);

        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("provider", provider);
        snapshot.put("url", url);
        putIfHasText(snapshot, "videoId", videoId);
        putIfHasText(snapshot, "title", metadata.title());
        putIfHasText(snapshot, "description", metadata.description());
        putIfHasText(snapshot, "coverUrl", metadata.coverUrl());

        return buildSuccess("video", provider, url, snapshot);
    }

    /**
     * 功能：解析通用链接并返回链接卡片快照（标题/描述/封面/域名）。
     * 关键参数：url 为标准化链接。
     * 返回值/副作用：返回解析响应；副作用为触发网页元信息抓取请求。
     */
    private EmbedResolveResponse resolveLink(String url) {
        LinkMetadata metadata = fetchLinkMetadata(url);

        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("url", url);
        putIfHasText(snapshot, "title", metadata.title());
        putIfHasText(snapshot, "description", metadata.description());
        putIfHasText(snapshot, "coverUrl", metadata.coverUrl());
        putIfHasText(snapshot, "domain", metadata.domain());
        putIfHasText(snapshot, "siteName", metadata.siteName());

        return buildSuccess("link", "link", url, snapshot);
    }

    /**
     * 功能：抓取链接 Open Graph 与 HTML 元信息，失败时返回最小可用快照。
     * 关键参数：url 为标准化链接。
     * 返回值/副作用：返回元信息对象；副作用为网络请求。
     */
    private LinkMetadata fetchLinkMetadata(String url) {
        String normalizedUrl = ensureUrlScheme(url);
        if (!isHttpUrl(normalizedUrl) || isBlockedMetadataHost(normalizedUrl)) {
            return buildMinimalMetadata(normalizedUrl);
        }

        try {
            Document document = Jsoup.connect(normalizedUrl)
                    .userAgent(METADATA_USER_AGENT)
                    .timeout(METADATA_TIMEOUT_MILLIS)
                    .followRedirects(true)
                    .get();

            String title = firstNonBlank(
                    readFirstMetaContent(document, "meta[property=og:title]"),
                    document.title(),
                    normalizedUrl
            );
            String description = firstNonBlank(
                    readFirstMetaContent(document, "meta[property=og:description]"),
                    readFirstMetaContent(document, "meta[name=description]"),
                    ""
            );
            String coverUrl = firstNonBlank(
                    readFirstMetaContent(document, "meta[property=og:image]"),
                    ""
            );
            String siteName = firstNonBlank(
                    readFirstMetaContent(document, "meta[property=og:site_name]"),
                    ""
            );

            return new LinkMetadata(
                    title,
                    description,
                    coverUrl,
                    siteName,
                    resolveDomain(normalizedUrl)
            );
        } catch (Exception ignored) {
            return buildMinimalMetadata(normalizedUrl);
        }
    }

    /**
     * 功能：读取指定 meta 选择器的 content 字段。
     * 关键参数：document 为网页文档；selector 为 CSS 选择器。
     * 返回值/副作用：返回 content 字符串或空字符串，无副作用。
     */
    private String readFirstMetaContent(Document document, String selector) {
        return document.select(selector).stream()
                .map(element -> element.attr("content"))
                .filter(StringUtils::hasText)
                .findFirst()
                .orElse("");
    }

    /**
     * 功能：构建抓取失败时的最小元信息结构，确保前端卡片可展示。
     * 关键参数：url 为目标链接。
     * 返回值/副作用：返回最小元信息对象，无副作用。
     */
    private LinkMetadata buildMinimalMetadata(String url) {
        return new LinkMetadata(url, "", "", "", resolveDomain(url));
    }

    /**
     * 功能：判断链接是否属于需要阻止抓取的内网/本地地址，降低 SSRF 风险。
     * 关键参数：url 为标准化链接。
     * 返回值/副作用：返回布尔值；无副作用。
     */
    private boolean isBlockedMetadataHost(String url) {
        try {
            URI uri = URI.create(url);
            String host = uri.getHost();
            if (!StringUtils.hasText(host)) {
                return true;
            }
            String lowerHost = host.toLowerCase(Locale.ROOT);
            return "localhost".equals(lowerHost)
                    || lowerHost.startsWith("127.")
                    || "0.0.0.0".equals(lowerHost)
                    || lowerHost.startsWith("192.168.")
                    || lowerHost.startsWith("10.")
                    || lowerHost.startsWith("172.16.")
                    || lowerHost.endsWith(".local");
        } catch (Exception ignored) {
            return true;
        }
    }

    /**
     * 功能：判断字符串是否为可抓取的 http/https URL。
     * 关键参数：url 为待判定字符串。
     * 返回值/副作用：返回布尔值，无副作用。
     */
    private boolean isHttpUrl(String url) {
        try {
            URI uri = URI.create(url);
            String scheme = uri.getScheme();
            return "http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme);
        } catch (Exception ignored) {
            return false;
        }
    }

    /**
     * 功能：补全输入链接协议，缺失时默认追加 https://。
     * 关键参数：input 为原始输入。
     * 返回值/副作用：返回标准化链接字符串，无副作用。
     */
    private String ensureUrlScheme(String input) {
        String normalizedInput = normalizeInput(input);
        if (!StringUtils.hasText(normalizedInput)) {
            return "";
        }
        if (normalizedInput.matches("^(?i)https?://.*")) {
            return normalizedInput;
        }
        return "https://" + normalizedInput;
    }

    /**
     * 功能：提取链接域名用于前端链接卡片展示。
     * 关键参数：url 为标准化链接。
     * 返回值/副作用：返回域名字符串，失败时返回空字符串。
     */
    private String resolveDomain(String url) {
        try {
            URI uri = URI.create(url);
            return uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
        } catch (Exception ignored) {
            return "";
        }
    }

    /**
     * 功能：识别链接是否为 GitHub URL。
     * 关键参数：input 为用户输入。
     * 返回值/副作用：返回布尔值，无副作用。
     */
    private boolean isGithubUrl(String input) {
        try {
            URI uri = URI.create(ensureUrlScheme(input));
            String host = uri.getHost();
            return StringUtils.hasText(host) && host.toLowerCase(Locale.ROOT).contains("github.com");
        } catch (Exception ignored) {
            return false;
        }
    }

    /**
     * 功能：识别输入是否是 owner/repo 结构。
     * 关键参数：input 为用户输入。
     * 返回值/副作用：返回布尔值，无副作用。
     */
    private boolean looksLikeGithubOwnerRepo(String input) {
        return StringUtils.hasText(input) && input.matches("^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$");
    }

    /**
     * 功能：提取 GitHub owner/repo，兼容 owner/repo 与 GitHub URL 两种输入。
     * 关键参数：input 为标准化输入。
     * 返回值/副作用：返回 owner/repo；无法解析返回空字符串。
     */
    private String extractGithubOwnerRepo(String input) {
        if (looksLikeGithubOwnerRepo(input)) {
            return input;
        }
        try {
            URI uri = URI.create(ensureUrlScheme(input));
            String host = uri.getHost();
            if (host == null || !host.toLowerCase(Locale.ROOT).contains("github.com")) {
                return "";
            }
            String[] segments = uri.getPath().replaceFirst("^/", "").split("/");
            if (segments.length < 2) {
                return "";
            }
            return segments[0] + "/" + segments[1];
        } catch (Exception ignored) {
            return "";
        }
    }

    /**
     * 功能：判断链接是否属于音乐平台（Spotify/网易云/Apple Music/Bilibili 音乐）。
     * 关键参数：url 为标准化链接。
     * 返回值/副作用：返回布尔值，无副作用。
     */
    private boolean isMusicUrl(String url) {
        return StringUtils.hasText(resolveMusicProvider(url));
    }

    /**
     * 功能：解析音乐平台 provider 标识。
     * 关键参数：url 为标准化链接。
     * 返回值/副作用：返回 provider 字符串；无法识别返回空字符串。
     */
    private String resolveMusicProvider(String url) {
        try {
            URI uri = URI.create(url);
            String host = uri.getHost();
            if (!StringUtils.hasText(host)) {
                return "";
            }
            String normalizedHost = host.toLowerCase(Locale.ROOT);
            if (normalizedHost.contains("spotify.com")) {
                return "spotify";
            }
            if (normalizedHost.contains("music.163.com")) {
                return "netease";
            }
            if (normalizedHost.contains("music.apple.com")) {
                return "apple-music";
            }
            if ((normalizedHost.contains("bilibili.com") || normalizedHost.contains("b23.tv"))
                    && url.toLowerCase(Locale.ROOT).contains("audio")) {
                return "bilibili";
            }
            return "";
        } catch (Exception ignored) {
            return "";
        }
    }

    /**
     * 功能：识别链接是否为视频链接（YouTube/Bilibili）。
     * 关键参数：url 为标准化链接。
     * 返回值/副作用：返回布尔值，无副作用。
     */
    private boolean isVideoUrl(String url) {
        String provider = resolveVideoProvider(url);
        return StringUtils.hasText(provider);
    }

    /**
     * 功能：解析视频 provider 标识。
     * 关键参数：url 为标准化链接。
     * 返回值/副作用：返回 provider 字符串；无法识别返回空字符串。
     */
    private String resolveVideoProvider(String url) {
        try {
            URI uri = URI.create(url);
            String host = uri.getHost();
            if (!StringUtils.hasText(host)) {
                return "";
            }
            String normalizedHost = host.toLowerCase(Locale.ROOT);
            if (normalizedHost.contains("youtube.com") || normalizedHost.contains("youtu.be")) {
                return "youtube";
            }
            if (normalizedHost.contains("bilibili.com") || normalizedHost.contains("b23.tv")) {
                return "bilibili";
            }
            return "";
        } catch (Exception ignored) {
            return "";
        }
    }

    /**
     * 功能：按 provider 提取视频 ID。
     * 关键参数：url 为标准化链接；provider 为视频平台标识。
     * 返回值/副作用：返回视频 ID，无法解析返回空字符串。
     */
    private String resolveVideoId(String url, String provider) {
        if (!StringUtils.hasText(provider)) {
            return "";
        }

        try {
            URI uri = URI.create(url);
            if ("youtube".equals(provider)) {
                if (uri.getHost() != null && uri.getHost().toLowerCase(Locale.ROOT).contains("youtu.be")) {
                    return uri.getPath().replace("/", "");
                }
                String query = uri.getQuery();
                if (!StringUtils.hasText(query)) {
                    return "";
                }
                for (String part : query.split("&")) {
                    String[] kv = part.split("=");
                    if (kv.length == 2 && "v".equals(kv[0])) {
                        return kv[1];
                    }
                }
                return "";
            }

            if ("bilibili".equals(provider)) {
                String[] segments = uri.getPath().split("/");
                for (String segment : segments) {
                    if (segment.startsWith("BV") || segment.startsWith("av")) {
                        return segment;
                    }
                }
            }
            return "";
        } catch (Exception ignored) {
            return "";
        }
    }

    /**
     * 功能：在描述中提取艺术家字段，便于音乐卡片展示副标题。
     * 关键参数：description 为元信息描述文本。
     * 返回值/副作用：返回艺术家文本；无法提取返回空字符串。
     */
    private String inferArtist(String description) {
        if (!StringUtils.hasText(description)) {
            return "";
        }

        String[] separators = {"-", "|", "·", "—"};
        for (String separator : separators) {
            if (description.contains(separator)) {
                String[] parts = description.split(separator);
                if (parts.length >= 2 && StringUtils.hasText(parts[0])) {
                    return parts[0].trim();
                }
            }
        }
        return "";
    }

    /**
     * 功能：构建解析成功响应。
     * 关键参数：cardType 为卡片类型；provider 为平台标识；normalizedUrl 为标准化链接；snapshot 为元信息快照。
     * 返回值/副作用：返回解析成功响应对象，无副作用。
     */
    private EmbedResolveResponse buildSuccess(String cardType, String provider, String normalizedUrl, Map<String, Object> snapshot) {
        return EmbedResolveResponse.builder()
                .cardType(cardType)
                .provider(provider)
                .normalizedUrl(normalizedUrl)
                .resolved(true)
                .fallbackUrl(normalizedUrl)
                .snapshot(snapshot)
                .build();
    }

    /**
     * 功能：构建解析失败时的降级响应。
     * 关键参数：cardType 为卡片类型；provider 为平台标识；normalizedUrl 为标准化链接；fallbackUrl 为回退链接。
     * 返回值/副作用：返回降级响应对象，无副作用。
     */
    private EmbedResolveResponse buildFallback(String cardType, String provider, String normalizedUrl, String fallbackUrl) {
        Map<String, Object> snapshot = new HashMap<>();
        putIfHasText(snapshot, "url", fallbackUrl);

        return EmbedResolveResponse.builder()
                .cardType(cardType)
                .provider(provider)
                .normalizedUrl(normalizedUrl)
                .resolved(false)
                .fallbackUrl(fallbackUrl)
                .snapshot(snapshot)
                .build();
    }

    /**
     * 功能：标准化输入字符串，统一去除首尾空白。
     * 关键参数：input 为原始输入。
     * 返回值/副作用：返回标准化字符串；无副作用。
     */
    private String normalizeInput(String input) {
        return input == null ? "" : input.trim();
    }

    /**
     * 功能：返回首个非空字符串，便于多来源字段回退。
     * 关键参数：values 为候选字符串数组。
     * 返回值/副作用：返回首个非空字符串；若均为空返回空字符串。
     */
    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value.trim();
            }
        }
        return "";
    }

    /**
     * 功能：仅当 value 非空时写入 snapshot，避免 Map.of 对 null 的限制。
     * 关键参数：target 为目标 map；key 为字段名；value 为字段值。
     * 返回值/副作用：无返回值；副作用为可能修改 target map。
     */
    private void putIfHasText(Map<String, Object> target, String key, String value) {
        if (StringUtils.hasText(value)) {
            target.put(key, value.trim());
        }
    }

    /**
     * 链接元信息封装。
     */
    private record LinkMetadata(
            String title,
            String description,
            String coverUrl,
            String siteName,
            String domain
    ) {
    }
}
