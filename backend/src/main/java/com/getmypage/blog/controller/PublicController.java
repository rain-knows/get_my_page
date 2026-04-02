package com.getmypage.blog.controller;

import com.getmypage.blog.config.JwtProperties;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    private final JwtProperties jwtProperties;

    public PublicController(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    @GetMapping("/ping")
    public Map<String, Object> ping() {
        return Map.of(
            "message", "pong",
            "timestamp", Instant.now().toString(),
            "jwtExpireSeconds", jwtProperties.getExpireSeconds()
        );
    }
}
