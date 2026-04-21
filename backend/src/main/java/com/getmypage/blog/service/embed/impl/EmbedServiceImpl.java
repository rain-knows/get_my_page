package com.getmypage.blog.service.embed.impl;

import com.getmypage.blog.model.dto.response.EmbedResolveResponse;
import com.getmypage.blog.service.embed.EmbedService;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.util.Map;

/**
 * Embed 解析服务实现（契约可用版）。
 */
@Service
public class EmbedServiceImpl implements EmbedService {

    /**
     * 功能：解析 GitHub 链接或 owner/repo 输入，返回标准化卡片快照。
     * 关键参数：input 为原始输入。
     * 返回值/副作用：返回解析响应；无外部副作用。
     */
    @Override
    public EmbedResolveResponse resolveGithub(String input) {
        String normalized = normalizeInput(input);
        if (!StringUtils.hasText(normalized)) {
            return buildFallback("github", "", "");
        }

        String ownerRepo = extractGithubOwnerRepo(normalized);
        if (!StringUtils.hasText(ownerRepo)) {
            return buildFallback("github", normalized, normalized);
        }

        String canonicalUrl = "https://github.com/" + ownerRepo;
        return EmbedResolveResponse.builder()
                .provider("github")
                .normalizedUrl(canonicalUrl)
                .resolved(true)
                .fallbackUrl(canonicalUrl)
                .snapshot(Map.of(
                        "repo", ownerRepo,
                        "url", canonicalUrl,
                        "name", ownerRepo.substring(ownerRepo.indexOf('/') + 1)
                ))
                .build();
    }

    /**
     * 功能：解析音乐平台链接（Spotify/网易云/Apple Music/Bilibili），并返回标准化快照。
     * 关键参数：input 为原始输入链接。
     * 返回值/副作用：返回解析响应；无外部副作用。
     */
    @Override
    public EmbedResolveResponse resolveMusic(String input) {
        String normalized = normalizeInput(input);
        if (!StringUtils.hasText(normalized)) {
            return buildFallback("unknown", "", "");
        }

        String provider = resolveMusicProvider(normalized);
        if ("unknown".equals(provider)) {
            return buildFallback(provider, normalized, normalized);
        }

        return EmbedResolveResponse.builder()
                .provider(provider)
                .normalizedUrl(normalized)
                .resolved(true)
                .fallbackUrl(normalized)
                .snapshot(Map.of(
                        "provider", provider,
                        "url", normalized,
                        "title", "Unresolved Music Track"
                ))
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
     * 功能：提取 GitHub owner/repo 结构，兼容 owner/repo 与 github URL 两种输入。
     * 关键参数：input 为标准化输入。
     * 返回值/副作用：返回 owner/repo；无法解析时返回空字符串。
     */
    private String extractGithubOwnerRepo(String input) {
        if (input.matches("^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")) {
            return input;
        }
        try {
            URI uri = URI.create(input);
            String host = uri.getHost();
            if (host == null || !host.contains("github.com")) {
                return "";
            }
            String path = uri.getPath();
            if (!StringUtils.hasText(path)) {
                return "";
            }
            String[] segments = path.replaceFirst("^/", "").split("/");
            if (segments.length < 2) {
                return "";
            }
            return segments[0] + "/" + segments[1];
        } catch (Exception ignored) {
            return "";
        }
    }

    /**
     * 功能：根据链接域名识别音乐平台提供方。
     * 关键参数：url 为标准化 URL。
     * 返回值/副作用：返回 provider 标识；未识别时返回 unknown。
     */
    private String resolveMusicProvider(String url) {
        try {
            URI uri = URI.create(url);
            String host = uri.getHost();
            if (!StringUtils.hasText(host)) {
                return "unknown";
            }
            String normalizedHost = host.toLowerCase();
            if (normalizedHost.contains("spotify.com")) {
                return "spotify";
            }
            if (normalizedHost.contains("music.163.com")) {
                return "netease";
            }
            if (normalizedHost.contains("music.apple.com")) {
                return "apple-music";
            }
            if (normalizedHost.contains("bilibili.com") || normalizedHost.contains("b23.tv")) {
                return "bilibili";
            }
            return "unknown";
        } catch (Exception ignored) {
            return "unknown";
        }
    }

    /**
     * 功能：构建解析失败时的降级响应，供前端展示普通链接卡片。
     * 关键参数：provider 为平台标识；normalizedUrl 为标准化链接；fallbackUrl 为回退链接。
     * 返回值/副作用：返回降级响应对象；无副作用。
     */
    private EmbedResolveResponse buildFallback(String provider, String normalizedUrl, String fallbackUrl) {
        return EmbedResolveResponse.builder()
                .provider(provider)
                .normalizedUrl(normalizedUrl)
                .resolved(false)
                .fallbackUrl(fallbackUrl)
                .snapshot(Map.of())
                .build();
    }
}
