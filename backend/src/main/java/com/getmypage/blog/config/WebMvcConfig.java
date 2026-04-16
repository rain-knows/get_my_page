package com.getmypage.blog.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

/**
 * 跨域配置。
 * 覆盖本地开发、Vercel 部署与业务正式域名。
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    /**
     * 功能：为 MVC 层的 `/api/**` 注册跨域白名单，覆盖本地、Vercel 与正式业务域名。
     * 关键参数：`registry` 用于挂载跨域规则；允许来源由固定列表统一维护。
     * 返回值/副作用：无返回值；向 Spring MVC 全局注册 CORS 映射策略。
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        List<String> allowedOriginPatterns = List.of(
                "http://localhost:3000",
                "https://get-my-page.vercel.app",
                "https://*.vercel.app",
                "https://rainknows.cn",
                "https://www.rainknows.cn"
        );

        registry.addMapping("/api/**")
                .allowedOriginPatterns(allowedOriginPatterns.toArray(new String[0]))
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
