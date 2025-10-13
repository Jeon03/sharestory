package com.sharestory.sharestory_backend.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SafeOrderCreatedEvent {
    private final Long itemId;
}