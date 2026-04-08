package com.getmypage.blog.common.util;

import java.util.UUID;

/**
 * 通用 ID 工具。
 */
public final class IdUtils {

    private IdUtils() {
    }

    public static String uuid() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}
