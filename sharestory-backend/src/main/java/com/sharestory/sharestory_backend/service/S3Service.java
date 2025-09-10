// S3Service.java
package com.sharestory.sharestory_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class S3Service {

    private final S3Client s3Client;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    @Value("${cloud.aws.region.static}")
    private String region;

    /** 단일 파일 업로드 */
    public String uploadFile(MultipartFile file, String dir) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("빈 파일입니다.");
        }

        String original = StringUtils.cleanPath(file.getOriginalFilename() == null ? "file" : file.getOriginalFilename());
        String safeName = sanitize(original);
        String key = stripTrailingSlash(dir) + "/" + UUID.randomUUID() + "_" + safeName;

        PutObjectRequest req = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .acl(ObjectCannedACL.PUBLIC_READ) // 퍼블릭 접근 사용 시
                .contentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                .build();

        s3Client.putObject(req, RequestBody.fromBytes(file.getBytes()));
        return buildS3Url(key);
    }

    /** 다중 파일 업로드 */
    public List<String> uploadFiles(List<MultipartFile> files, String dir) throws IOException {
        List<String> urls = new ArrayList<>();
        if (files == null) return urls;
        for (MultipartFile f : files) {
            if (f == null || f.isEmpty()) continue;
            urls.add(uploadFile(f, dir));
        }
        return urls;
    }

    /** 객체 삭제 (필요시) */
    public void deleteByKey(String key) {
        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build());
    }

    /** region에 맞는 S3 퍼블릭 URL 생성 */
    private String buildS3Url(String key) {
        // us-east-1만 호스트가 s3.amazonaws.com (레거시 패턴)
        String host = "us-east-1".equals(region) ? "s3.amazonaws.com" : "s3." + region + ".amazonaws.com";
        return "https://" + bucket + "." + host + "/" + key;
    }

    private String stripTrailingSlash(String dir) {
        return dir == null ? "" : dir.replaceAll("/+$", "");
    }

    /** 파일명 sanitize (간단) */
    private String sanitize(String name) {
        String base = name.replace("\\", "/");
        base = base.contains("/") ? base.substring(base.lastIndexOf('/') + 1) : base;
        base = base.replaceAll("[^A-Za-z0-9._-]", "_");
        if (base.isBlank()) base = "file";
        byte[] bytes = base.getBytes(StandardCharsets.UTF_8);
        if (bytes.length > 120) base = new String(bytes, 0, 120, StandardCharsets.UTF_8);
        return base;
    }
}
