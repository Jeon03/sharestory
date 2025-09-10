package com.sharestory.sharestory_backend.api;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/map")
@RequiredArgsConstructor
public class MapController {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${kakao.rest-key}")
    private String kakaoRestKey;

    @GetMapping("/region")
    public ResponseEntity<?> getRegion(@RequestParam double lat, @RequestParam double lng) {
        String url = "https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=" + lng + "&y=" + lat;
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "KakaoAK " + kakaoRestKey);

        HttpEntity<Void> entity = new HttpEntity<>(headers);
        ResponseEntity<String> res = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
        return ResponseEntity.ok(res.getBody());
    }
}
