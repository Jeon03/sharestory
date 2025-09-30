package com.sharestory.sharestory_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BidRequestDto {

    /**
     * 사용자가 입찰하려는 금액
     */
    private int  bidPrice;

}