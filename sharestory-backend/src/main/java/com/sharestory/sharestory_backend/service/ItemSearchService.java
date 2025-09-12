package com.sharestory.sharestory_backend.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.DistanceUnit;
import co.elastic.clients.elasticsearch._types.SortOptions;
import co.elastic.clients.elasticsearch._types.SortOrder;
import co.elastic.clients.elasticsearch._types.query_dsl.*;
import co.elastic.clients.elasticsearch.core.SearchRequest;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import com.sharestory.sharestory_backend.domain.ItemDoc;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ItemSearchService {

    private final ElasticsearchClient es;

    public List<Map<String, Object>> autocomplete(
            String keyword, double userLat, double userLon, String distance
    ) throws IOException {

        // 자동완성 (search_as_you_type + bool_prefix)
        MultiMatchQuery matchSuggest = MultiMatchQuery.of(m -> m
                .query(keyword)
                .type(TextQueryType.BoolPrefix)
                .fields("titleSuggest", "titleSuggest._2gram", "titleSuggest._3gram")
        );

        // 한국어 접두 강화용 ngram 필드
        MultiMatchQuery matchNgram = MultiMatchQuery.of(m -> m
                .query(keyword)
                .fields("titleNgram")
        );

        // 위치 필터 (반경)
        GeoDistanceQuery geoFilter = GeoDistanceQuery.of(g -> g
                .field("location")
                .distance(distance) // e.g. "5km"
                // ✅ 변형 선택 → 그 안에서 lat/lon 지정
                .location(loc -> loc.latlon(ll -> ll.lat(userLat).lon(userLon)))
        );

        // bool 조합
        BoolQuery boolQuery = BoolQuery.of(b -> b
                .must(Query.of(q -> q.multiMatch(matchSuggest)))
                .must(Query.of(q -> q.multiMatch(matchNgram)))
                .filter(Query.of(q -> q.geoDistance(geoFilter)))
        );

        // 가까운 순 + 점수순 정렬
        List<SortOptions> sort = Arrays.asList(
                SortOptions.of(s -> s.geoDistance(g -> g
                        .field("location")
                        .location(l -> l.latlon(ll -> ll.lat(userLat).lon(userLon))) // ✅ 동일 패턴
                        .unit(DistanceUnit.Kilometers)
                        .order(SortOrder.Asc))),
                SortOptions.of(s -> s.score(sc -> sc.order(SortOrder.Desc)))
        );

        // 검색 요청
        SearchRequest req = SearchRequest.of(s -> s
                .index("items")
                .size(10)
                .source(src -> src.filter(f -> f.includes("title", "price", "location")))
                .query(Query.of(q -> q.bool(boolQuery)))
                .sort(sort)
        );

        SearchResponse<ItemDoc> resp = es.search(req, ItemDoc.class);

        // 결과 변환 (거리 km 는 Haversine로 직접 계산)
        List<Map<String, Object>> out = new ArrayList<>();
        for (Hit<ItemDoc> hit : resp.hits().hits()) {
            ItemDoc doc = hit.source();
            if (doc == null || doc.getLocation() == null) continue;

            double lat = doc.getLocation().getLat();
            double lon = doc.getLocation().getLon();
            double distanceKm = haversineKm(userLat, userLon, lat, lon);

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("title", doc.getTitle());
            row.put("price", doc.getPrice());
            row.put("lat", lat);
            row.put("lon", lon);
            row.put("distanceKm", distanceKm);
            out.add(row);
        }
        return out;
    }

    // Haversine 거리(km)
    private static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0; // km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat/2)*Math.sin(dLat/2)
                + Math.cos(Math.toRadians(lat1))*Math.cos(Math.toRadians(lat2))
                + Math.sin(dLon/2)*Math.sin(dLon/2) - 1; // 안전하게 다음 줄에서 보정
        // 위 행에서 오타 방지: a 재계산
        a = Math.sin(dLat/2)*Math.sin(dLat/2)
                + Math.cos(Math.toRadians(lat1))*Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon/2)*Math.sin(dLon/2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return Math.round(R * c * 1000.0) / 1000.0; // 소수 셋째 자리 반올림
    }
}
