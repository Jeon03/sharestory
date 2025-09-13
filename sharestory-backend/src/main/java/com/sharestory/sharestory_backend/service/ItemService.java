package com.sharestory.sharestory_backend.service;

import com.sharestory.sharestory_backend.domain.Item;
import com.sharestory.sharestory_backend.domain.ItemImage;
import com.sharestory.sharestory_backend.dto.ItemRequestDto;
import com.sharestory.sharestory_backend.dto.ItemStatus;
import com.sharestory.sharestory_backend.repo.ItemImageRepository;
import com.sharestory.sharestory_backend.repo.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;
    private final ItemImageRepository itemImageRepository;
    private final S3Service s3Service;
    private final ItemSearchIndexer itemSearchIndexer;

    @Transactional
    public Item registerItem(ItemRequestDto dto, List<MultipartFile> images, Long userId) throws IOException {
        // 0) 방어적 처리
        List<MultipartFile> safeImages = images == null ? Collections.emptyList() : images;
        if (safeImages.size() > 3) {
            throw new IllegalArgumentException("이미지는 최대 3장까지 업로드할 수 있습니다.");
        }

        // 1) Item 먼저 저장 (ID 필요하므로 saveAndFlush 권장)
        Item item = Item.builder()
                .title(dto.getTitle())
                .category(dto.getCategory())
                .status(ItemStatus.ON_SALE)
                .condition(dto.getCondition())
                .price(dto.getPrice())
                .description(dto.getDescription())
                .dealInfo(dto.getDealInfo())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .userId(userId)
                .createdDate(LocalDateTime.now())
                .build();

        itemRepository.saveAndFlush(item); // ID 채번 보장

        // 2) 이미지 업로드 (S3는 트랜잭션 바깥이므로 보상 고려)
        List<String> uploadedUrls = new ArrayList<>();
        try {
            for (MultipartFile file : safeImages) {
                if (file == null || file.isEmpty()) continue;
                String url = s3Service.uploadFile(file, "items/" + item.getId());
                uploadedUrls.add(url);
            }
        } catch (Exception e) {
            // 보상: 이미 업로드된 객체 삭제(가능하면 key도 따로 저장해서 deleteByKey 사용)
            // 여기서는 URL에서 key를 파싱하기 어렵다고 가정 → 필요 시 S3Service가 key를 리턴하도록 변경 권장
            // s3Service.deleteByKey(key);
            throw e;
        }

        // 3) ItemImage 엔티티 생성/저장 (배치 저장)
        List<ItemImage> imageEntities = IntStream.range(0, uploadedUrls.size())
                .mapToObj(i -> ItemImage.builder()
                        .item(item)
                        .url(uploadedUrls.get(i))
                        .sortOrder(i)
                        .build())
                .collect(Collectors.toList());

        if (!imageEntities.isEmpty()) {
            itemImageRepository.saveAll(imageEntities);
            // 양방향 매핑 사용 시 컬렉션도 갱신
            item.getImages().addAll(imageEntities);
            // 대표 이미지(첫 장)
            item.setImageUrl(uploadedUrls.get(0));
            // 명시 저장은 선택(영속 상태라 flush로 반영됨)
            // itemRepository.save(item);
        }

        itemSearchIndexer.indexItem(item);

        return item;
    }

    @Transactional(readOnly = true)
    public List<String> getImageUrls(Long itemId) {
        return itemImageRepository.findByItemIdOrderBySortOrderAsc(itemId).stream()
                .map(ItemImage::getUrl)
                .collect(Collectors.toList()); // (Java 16+면 .toList() 가능
    }


}
