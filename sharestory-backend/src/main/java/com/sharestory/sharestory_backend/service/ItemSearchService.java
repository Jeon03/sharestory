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
     * 🔍 일반 검색 (로그인 사용자: 위치검색 / 비로그인: 키워드검색)
     */
    public List<ItemSummaryDto> searchItems(String keyword, Double userLat, Double userLon, String distance) throws IOException {
        List<Item> items = searchInternal(keyword, userLat, userLon, distance, 50);
        return items.stream().map(this::toSummaryDto).collect(Collectors.toList());
    }

    /**
     * 비로그인 사용자용 → 키워드 검색만
     */
    public List<ItemSummaryDto> searchItemsByKeyword(String keyword) throws IOException {
        List<Item> items = searchKeywordOnly(keyword, 50);
        return items.stream().map(this::toSummaryDto).collect(Collectors.toList());
    }

    /**
     * ✨ 자동완성 검색
     * 로그인: titleSuggest + ngram + 위치
     * 비로그인: titleSuggest 전용
     */
    public List<ItemSummaryDto> autocomplete(String keyword, Double userLat, Double userLon, String distance) throws IOException {
        List<Item> items;

        if (userLat != null && userLon != null) {
            // ✅ 로그인 사용자 → 기존 로직 그대로
            items = searchInternal(keyword, userLat, userLon, distance, 10);
        } else {
            // ✅ 비로그인 사용자 → titleSuggest 전용 (search_as_you_type)
            MultiMatchQuery suggestQuery = MultiMatchQuery.of(m -> m
                    .query(keyword)
                    .type(TextQueryType.BoolPrefix)
                    .fields("titleSuggest", "titleSuggest._2gram", "titleSuggest._3gram")
            );

            SearchRequest req = SearchRequest.of(s -> s
                    .index("items")
                    .size(10)
                    .source(src -> src.filter(f -> f.includes("id")))
                    .query(Query.of(q -> q.multiMatch(suggestQuery)))
            );

            SearchResponse<ItemDoc> resp = es.search(req, ItemDoc.class);

            List<Long> ids = resp.hits().hits().stream()
                    .map(Hit::source)
                    .filter(Objects::nonNull)
                    .map(ItemDoc::getId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            if (ids.isEmpty()) return Collections.emptyList();

            List<Item> found = itemRepository.findAllById(ids);
            Map<Long, Item> itemMap = found.stream().collect(Collectors.toMap(Item::getId, i -> i));
            items = ids.stream().map(itemMap::get).filter(Objects::nonNull).collect(Collectors.toList());
        }

        return items.stream().map(this::toSummaryDto).collect(Collectors.toList());
    }

    /**
     * 키워드 검색만 수행하는 내부 로직
     */
    private List<Item> searchKeywordOnly(String keyword, int size) throws IOException {
        MultiMatchQuery matchNgram = MultiMatchQuery.of(m -> m
                .query(keyword)
                .fields("titleNgram")
        );

        SearchRequest req = SearchRequest.of(s -> s
                .index("items")
                .size(size)
                .source(src -> src.filter(f -> f.includes("id")))
                .query(Query.of(q -> q.multiMatch(matchNgram)))
        );

        SearchResponse<ItemDoc> resp = es.search(req, ItemDoc.class);

        List<Long> ids = resp.hits().hits().stream()
                .map(Hit::source)
                .filter(Objects::nonNull)
                .map(ItemDoc::getId)
                .collect(Collectors.toList());

        if (ids.isEmpty()) return Collections.emptyList();

        List<Item> items = itemRepository.findAllById(ids);
        Map<Long, Item> itemMap = items.stream().collect(Collectors.toMap(Item::getId, i -> i));

        return ids.stream().map(itemMap::get).filter(Objects::nonNull).collect(Collectors.toList());
    }

    /**
     * 내부 공통 로직 (로그인 유저 검색)
     */
    private List<Item> searchInternal(String keyword, Double userLat, Double userLon, String distance, int size) throws IOException {
        MultiMatchQuery matchSuggest = MultiMatchQuery.of(m -> m
                .query(keyword)
                .type(TextQueryType.BoolPrefix)
                .fields("titleSuggest", "titleSuggest._2gram", "titleSuggest._3gram")
        );

        MultiMatchQuery matchNgram = MultiMatchQuery.of(m -> m
                .query(keyword)
                .fields("titleNgram")
        );

        BoolQuery.Builder boolBuilder = new BoolQuery.Builder();

        if (userLat != null && userLon != null) {
            // ✅ 로그인 유저 → must + geo_distance
            boolBuilder.must(Query.of(q -> q.multiMatch(matchSuggest)))
                    .must(Query.of(q -> q.multiMatch(matchNgram)));

            GeoDistanceQuery geoFilter = GeoDistanceQuery.of(g -> g
                    .field("location")
                    .distance(distance)
                    .location(loc -> loc.latlon(ll -> ll.lat(userLat).lon(userLon)))
            );
            boolBuilder.filter(Query.of(q -> q.geoDistance(geoFilter)));
        } else {
            // ✅ 비로그인 유저 (일반 검색만): should
            boolBuilder.should(Query.of(q -> q.multiMatch(matchSuggest)))
                    .should(Query.of(q -> q.multiMatch(matchNgram)))
                    .minimumShouldMatch("1");
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

        if (ids.isEmpty()) return Collections.emptyList();

        List<Item> items = itemRepository.findAllById(ids);
        Map<Long, Item> itemMap = items.stream().collect(Collectors.toMap(Item::getId, i -> i));

        return ids.stream().map(itemMap::get).filter(Objects::nonNull).collect(Collectors.toList());
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
                .dealInfo(item.getDealInfo())
                .build();
    }
}

