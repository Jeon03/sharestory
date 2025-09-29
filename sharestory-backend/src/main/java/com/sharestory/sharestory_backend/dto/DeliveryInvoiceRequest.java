package com.sharestory.sharestory_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DeliveryInvoiceRequest {
    private String courier;
    private String trackingNumber;
}
