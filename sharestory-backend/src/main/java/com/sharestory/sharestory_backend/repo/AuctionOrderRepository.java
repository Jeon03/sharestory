package com.sharestory.sharestory_backend.repo;

import com.sharestory.sharestory_backend.domain.AuctionOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuctionOrderRepository extends JpaRepository<AuctionOrder, Long> {
    // 기본적인 CRUD(Create, Read, Update, Delete) 메소드는
    // JpaRepository에 이미 모두 구현되어 있으므로 추가 코드가 필요 없습니다.
}