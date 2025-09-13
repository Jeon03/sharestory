package com.sharestory.sharestory_backend.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.DistanceUnit;
import co.elastic.clients.elasticsearch._types.SortOptions;
import co.elastic.clients.elasticsearch._types.SortOrder;
import co.elastic.clients.elasticsearch._types.query_dsl.*;
import co.elastic.clients.elasticsearch.core.SearchRequest;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import com.sharestory.sharestory_backend.domain.Item;
import com.sharestory.sharestory_backend.domain.ItemDoc;
import com.sharestory.sharestory_backend.dto.ItemSummaryDto;
import com.sharestory.sharestory_backend.repo.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItemSearchService {

    private final ElasticsearchClient es;
    private final ItemRepository itemRepository;

    /**
     * 🔍 일반 검색 (전체 결과, DTO 반환)
     */
    public List<ItemSummaryDto> searchItems(String keyword, Double userLat, Double userLon, String distance) throws IOException {
        List<Item> items = searchInternal(keyword, userLat, userLon, distance, 50);
        return items.stream().map(this::toSummaryDto).collect(Collectors.toList());
    }

    /**
     * ✨ 자동완성 검색 (빠른 추천, DTO 반환)
     */
    public List<ItemSummaryDto> autocomplete(String keyword, Double userLat, Double userLon, String distance) throws IOException {
        List<Item> items = searchInternal(keyword, userLat, userLon, distance, 10);
        return items.stream().map(this::toSummaryDto).collect(Collectors.toList());
    }

    /**
     * 내부 공통 로직 (ES → id 추출 → DB 조회)
     */
    private List<Item> searchInternal(String keyword, Double userLat, Double userLon, String distance, int size) throws IOException {
        // ES 쿼리 정의
        MultiMatchQuery matchSuggest = MultiMatchQuery.of(m -> m
                .query(keyword)
                .type(TextQueryType.BoolPrefix)
                .fields("titleSuggest", "titleSuggest._2gram", "titleSuggest._3gram")
        );

        MultiMatchQuery matchNgram = MultiMatchQuery.of(m -> m
                .query(keyword)
                .fields("titleNgram")
        );

        BoolQuery.Builder boolBuilder = new BoolQuery.Builder()
                .must(Query.of(q -> q.multiMatch(matchSuggest)))
                .must(Query.of(q -> q.multiMatch(matchNgram)));

        if (userLat != null && userLon != null) {
            GeoDistanceQuery geoFilter = GeoDistanceQuery.of(g -> g
                    .field("location")
                    .distance(distance)
                    .location(loc -> loc.latlon(ll -> ll.lat(userLat).lon(userLon)))
            );
            boolBuilder.filter(Query.of(q -> q.geoDistance(geoFilter)));
        }

        List<SortOptions> sort = new ArrayList<>();
        if (userLat != null && userLon != null) {
            sort.add(SortOptions.of(s -> s.geoDistance(g -> g
                    .field("location")
                    .location(l -> l.latlon(ll -> ll.lat(userLat).lon(userLon)))
                    .unit(DistanceUnit.Kilometers)
                    .order(SortOrder.Asc)
            )));
        }
        sort.add(SortOptions.of(s -> s.score(sc -> sc.order(SortOrder.Desc))));

        // ES 요청 (id만 추출)
        SearchRequest req = SearchRequest.of(s -> s
                .index("items")
                .size(size)
                .source(src -> src.filter(f -> f.includes("id")))
                .query(Query.of(q -> q.bool(boolBuilder.build())))
                .sort(sort)
        );

        SearchResponse<ItemDoc> resp = es.search(req, ItemDoc.class);

        List<Long> ids = resp.hits().hits().stream()
                .map(Hit::source)
                .filter(Objects::nonNull)
                .map(ItemDoc::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        System.out.println("[ES RESULT IDS] " + ids);

        if (ids.isEmpty()) {
            System.out.println("[ES RESULT] 검색 결과 없음");
            return Collections.emptyList();
        }

        // DB 조회
        List<Item> items = itemRepository.findAllById(ids);

        // 순서 보존
        Map<Long, Item> itemMap = items.stream()
                .collect(Collectors.toMap(Item::getId, i -> i));

        return ids.stream()
                .map(itemMap::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    /**
     * 엔티티 → DTO 변환
     */
    private ItemSummaryDto toSummaryDto(Item item) {
        return ItemSummaryDto.builder()
                .id(item.getId())
                .title(item.getTitle())
                .price(item.getPrice())
                .imageUrl(item.getImageUrl())
                .createdDate(item.getCreatedDate() != null ? item.getCreatedDate().toString() : null)
                .itemStatus(item.getStatus() != null ? item.getStatus().name() : null)
                .favoriteCount(item.getFavoriteCount())
                .viewCount(item.getViewCount())
                .chatRoomCount(item.getChatRoomCount())
                .latitude(item.getLatitude())
                .longitude(item.getLongitude())
                .build();
    }
}
