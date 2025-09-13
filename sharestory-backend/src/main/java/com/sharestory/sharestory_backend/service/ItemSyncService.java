package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.Item;
import com.sharestory.sharestory_backend.repo.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ItemSyncService implements ApplicationRunner {

    private final ItemRepository itemRepository;
    private final ItemSearchIndexer itemSearchIndexer;

    @Override
    @Transactional(readOnly = true)
    public void run(ApplicationArguments args) {
        System.out.println("[SYNC] DB → Elasticsearch 초기 동기화 시작");

        List<Item> allItems = itemRepository.findAll();
        int success = 0;

        for (Item item : allItems) {
            try {
                itemSearchIndexer.indexItem(item);
                success++;
            } catch (Exception e) {
                System.err.println("[SYNC FAIL] id=" + item.getId() + " " + e.getMessage());
            }
        }

        System.out.printf("[SYNC] 완료: %d/%d 개 동기화%n", success, allItems.size());
    }
}
