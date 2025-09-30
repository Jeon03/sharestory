package com.sharestory.sharestory_backend.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.IndexResponse;
import com.sharestory.sharestory_backend.domain.AuctionItem;
import com.sharestory.sharestory_backend.domain.AuctionItemDoc;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuctionItemSearchIndexer {

    private final ElasticsearchClient es;

    public void indexItem(AuctionItem auctionItem) {
        try {
            AuctionItemDoc doc = AuctionItemDoc.fromEntity(auctionItem);

            IndexResponse resp = es.index(i -> i
                    .index("auction_items")
                    .id(auctionItem.getId().toString())
                    .document(doc)
            );
            log.info("[ES INDEX SUCCESS] id={}", resp.id());

        } catch (Exception e) {
            log.error("[ES INDEX FAIL] itemId={}, error={}", auctionItem.getId(), e.getMessage(), e);
        }
    }

    public void deleteItem(Long auctionItemId) {
        try {
            es.delete(d -> d.index("auction_items").id(auctionItemId.toString()));
            log.info("[ES DELETE SUCCESS] id={}", auctionItemId);
        } catch (Exception e) {
            log.error("[ES DELETE FAIL] itemId={}, error={}", auctionItemId, e.getMessage(), e);
        }
    }
}