package com.sharestory.sharestory_backend.api;

import com.sharestory.sharestory_backend.service.OpenAiService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/category")
@RequiredArgsConstructor
public class CategoryController {

    private final OpenAiService openAiService;

    @GetMapping("/suggest")
    public String suggestCategory(@RequestParam String title) {
        System.out.println("📩 [요청 수신] /api/category/suggest → title = " + title);
        try {
            String result = openAiService.suggestCategory(title);
            System.out.println("✅ [추천 완료] title = " + title + " → 추천 결과 = " + result);
            return result;
        } catch (Exception e) {
            System.err.println("❌ [추천 실패] title = " + title + " / 오류: " + e.getMessage());
            e.printStackTrace();
            return "others";
        }
    }
}
