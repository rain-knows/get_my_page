package com.getmypage.blog;

import com.getmypage.blog.config.JwtProperties;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@MapperScan("com.getmypage.blog")
@EnableConfigurationProperties(JwtProperties.class)
public class BlogBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BlogBackendApplication.class, args);
	}

}
