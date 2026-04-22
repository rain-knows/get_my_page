package com.getmypage.blog.service.embed;

import com.getmypage.blog.model.dto.response.EmbedResolveResponse;

/**
 * Embed 解析服务。
 */
public interface EmbedService {

    /**
     * 功能：统一解析外链并自动识别卡片类型（GitHub/音乐/视频/通用链接）。
     * 关键参数：input 为原始输入链接或 owner/repo。
     * 返回值/副作用：返回统一解析响应；内部可能触发元信息抓取网络请求。
     */
    EmbedResolveResponse resolve(String input);

    /**
     * 功能：解析 GitHub 仓库链接并返回可写入编辑器节点的快照信息。
     * 关键参数：input 为原始输入链接或 owner/repo。
     * 返回值/副作用：返回解析响应；无外部副作用。
     */
    EmbedResolveResponse resolveGithub(String input);

    /**
     * 功能：解析音乐平台链接并返回可写入编辑器节点的快照信息。
     * 关键参数：input 为原始音乐链接。
     * 返回值/副作用：返回解析响应；无外部副作用。
     */
    EmbedResolveResponse resolveMusic(String input);
}
