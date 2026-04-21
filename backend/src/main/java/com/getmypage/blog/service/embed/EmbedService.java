package com.getmypage.blog.service.embed;

import com.getmypage.blog.model.dto.response.EmbedResolveResponse;

/**
 * Embed 解析服务。
 */
public interface EmbedService {

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
