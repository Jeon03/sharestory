package com.sharestory.sharestory_backend.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.IndexResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sharestory.sharestory_backend.domain.Item;
import com.sharestory.sharestory_backend.domain.ItemDoc;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ItemSearchIndexer {

    private final ElasticsearchClient es;

    public void indexItem(Item item) {
        try {

            ItemDoc doc = new ItemDoc();
            doc.setId(item.getId());
            doc.setTitle(item.getTitle());
            doc.setTitleSuggest(item.getTitle());
            doc.setTitleNgram(item.getTitle());
            doc.setPrice(item.getPrice());

            if (item.getLatitude() != null && item.getLongitude() != null) {
                ItemDoc.GeoPoint point = new ItemDoc.GeoPoint();
                point.setLat(item.getLatitude());
                point.setLon(item.getLongitude());
                doc.setLocation(point);
            }

            // ✅ 날짜
            if (item.getCreatedDate() != null) {
                doc.setCreatedAt(item.getCreatedDate().toString());
            }
            if (item.getUpdatedDate() != null) {
                doc.setUpdatedAt(item.getUpdatedDate().toString());
            }


            // ✅ 대표 이미지
            if (item.getImages() != null && !item.getImages().isEmpty()) {
                doc.setImageUrl(item.getImages().get(0).getUrl());
            } else {
                doc.setImageUrl(item.getImageUrl()); // fallback
            }

            // ✅ 상태 저장
            doc.setItemStatus(item.getStatus().name());
            doc.setFavoriteCount(item.getFavoriteCount());
            doc.setViewCount(item.getViewCount());
            doc.setChatRoomCount(item.getChatRoomCount());

            try {
                ObjectMapper mapper = new ObjectMapper();
                String json = mapper.writeValueAsString(doc);
                System.out.println("[DEBUG JSON] " + json);
            } catch (Exception e) {
                e.printStackTrace();
            }

            // 3. Elasticsearch 인덱싱
            IndexResponse resp = es.index(i -> i
                    .index("items")
                    .id(item.getId().toString()) // DB id 기반으로 문서 id 지정
                    .document(doc)
            );

            System.out.println("[INDEX SUCCESS] id=" + resp.id());

        } catch (Exception e) {
            System.err.println("[INDEX FAIL] " + e.getMessage());
        }
    }

    public void deleteItem(Long itemId) {
        try {
            var resp = es.delete(d -> d.index("items").id(itemId.toString()));
            if (resp.result().name().equalsIgnoreCase("Deleted")) {
                System.out.printf("🧹 [ES DELETE SUCCESS] id=%d%n", itemId);
            } else {
                System.out.printf("⚠️ [ES DELETE WARNING] id=%d result=%s%n", itemId, resp.result());
            }
        } catch (Exception e) {
            System.err.printf("❌ [ES DELETE FAIL] id=%d: %s%n", itemId, e.getMessage());
            e.printStackTrace();
        }
    }
}
