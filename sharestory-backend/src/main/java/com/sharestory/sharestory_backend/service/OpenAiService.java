package com.sharestory.sharestory_backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OpenAiService {

    @Value("${openai.api.key}")
    private String apiKey;

    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";

    /**
     * 제목(title)을 기반으로 카테고리 key 추천
     */
    public String suggestCategory(String title) throws IOException {
        OkHttpClient client = new OkHttpClient();
        ObjectMapper mapper = new ObjectMapper();

        // ✅ 프론트엔드 CategoryAutoSuggest의 key 목록과 1:1로 동일하게 유지
        String[] categoryKeys = {
                "digital", "appliance", "furniture", "living_kitchen",
                "kids", "kids_books", "womens_clothing", "womens_accessories",
                "mens_fashion", "beauty", "sports", "hobby", "books",
                "ticket", "processed_food", "health", "pet", "plant",
                "others", "buying"
        };

        String joinedKeys = String.join(", ", categoryKeys);

        // ✅ 프롬프트 (모델이 정확히 key만 반환하게)
        String prompt = String.format("""
            아래 상품 제목을 보고 가장 알맞은 카테고리 key를 정확히 하나만 골라주세요.
            반드시 아래 key 중 하나만 출력하세요. (설명, 문장, 기타 단어 금지)
            
            제목: "%s"
            카테고리 key 목록: %s
        """, title, joinedKeys);

        Map<String, Object> requestBody = Map.of(
                "model", "gpt-3.5-turbo",
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                "temperature", 0.0
        );

        Request request = new Request.Builder()
                .url(OPENAI_URL)
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Content-Type", "application/json")
                .post(RequestBody.create(
                        mapper.writeValueAsString(requestBody),
                        MediaType.get("application/json; charset=utf-8")
                ))
                .build();

        try (Response response = client.newCall(request).execute()) {
            String body = response.body().string();
            JsonNode node = mapper.readTree(body);
            System.out.println("🧠 [OpenAI 응답]: " + body);

            JsonNode choices = node.path("choices");
            if (choices.isArray() && choices.size() > 0) {
                String result = choices.get(0).path("message").path("content").asText().trim();
                result = result.replaceAll("[^a-zA-Z0-9_]", ""); // 불필요한 문자 제거

                // ✅ 반환값 검증
                for (String key : categoryKeys) {
                    if (key.equalsIgnoreCase(result)) {
                        return key;
                    }
                }

                return "others";
            } else {
                return "others";
            }
        } catch (Exception e) {
            System.err.println("❌ GPT 카테고리 추천 실패: " + e.getMessage());
            return "others";
        }
    }
}
