package com.docsearch;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class DocSearchApplication {
    public static void main(String[] args) {
        SpringApplication.run(DocSearchApplication.class, args);
    }
}
