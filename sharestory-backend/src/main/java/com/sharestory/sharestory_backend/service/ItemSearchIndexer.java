package com.sharestory.sharestory_backend.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.IndexResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sharestory.sharestory_backend.domain.Item;
import com.sharestory.sharestory_backend.domain.ItemDoc;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ItemSearchIndexer {

    private final ElasticsearchClient es;

    public void indexItem(Item item) {
        try {



            // 1. 좌표 매핑
            ItemDoc.GeoPoint point = new ItemDoc.GeoPoint();
            point.setLat(item.getLatitude());
            point.setLon(item.getLongitude());

            // 2. ES 문서 객체 생성
            ItemDoc doc = new ItemDoc();
            doc.setTitle(item.getTitle());
            doc.setTitleSuggest(item.getTitle());
            doc.setTitleNgram(item.getTitle());
            doc.setPrice(item.getPrice());
            doc.setLocation(point);
            doc.setCreatedAt(LocalDateTime.now());

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
}
