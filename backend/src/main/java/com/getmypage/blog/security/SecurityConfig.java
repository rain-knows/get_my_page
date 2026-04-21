package com.getmypage.blog.security;

import com.getmypage.blog.security.auth.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Spring Security 配置。
 * 无状态 JWT 认证，公开读接口，写接口在业务层进行细粒度权限控制。
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    /**
     * 功能：注入 JWT 认证过滤器供安全链路使用。
     * 关键参数：jwtAuthenticationFilter 为 JWT 解析与鉴权过滤器。
     * 返回值/副作用：无返回值；构造后用于构建 SecurityFilterChain。
     */
    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    /**
     * 功能：构建系统安全过滤链，定义公开接口与认证保护边界。
     * 关键参数：http 为 Spring Security HTTP 配置对象。
     * 返回值/副作用：返回 SecurityFilterChain；副作用为注册 JWT 过滤器与授权规则。
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // 公开接口
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/posts",
                                "/api/posts/**",
                                "/api/categories",
                                "/api/tags",
                                "/api/search",
                                "/api/posts/*/comments",
                                "/api/embeds/**",
                                "/api/files/upload"
                        ).permitAll()
                        // Swagger 文档
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/api-docs/**",
                                "/v3/api-docs/**"
                        ).permitAll()
                        // Actuator
                        .requestMatchers("/actuator/**").permitAll()
                        // 管理接口
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        // 其余需要认证
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * 功能：提供密码加密器，统一密码哈希强度。
     * 关键参数：无。
     * 返回值/副作用：返回 BCryptPasswordEncoder；无其他副作用。
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    /**
     * 功能：暴露认证管理器供登录流程使用。
     * 关键参数：authenticationConfiguration 为认证配置对象。
     * 返回值/副作用：返回 AuthenticationManager；无其他副作用。
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    /**
     * 功能：注册安全链路使用的 CORS 配置源，放行本地开发、Vercel 部署域名和业务正式域名。
     * 关键参数：无外部参数；内部维护允许来源列表、方法与请求头策略。
     * 返回值/副作用：返回 Spring Security 使用的 `CorsConfigurationSource`，影响 `/api/**` 的跨域访问行为。
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:3000",
                "https://get-my-page.vercel.app",
                "https://*.vercel.app",
                "https://rainknows.cn",
                "https://www.rainknows.cn"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
