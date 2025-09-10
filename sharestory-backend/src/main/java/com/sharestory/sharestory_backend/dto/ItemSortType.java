package com.sharestory.sharestory_backend.dto;

public enum ItemSortType {
    LATEST, FAVORITES, VIEWS;

    public static ItemSortType from(String s) {
        if (s == null) return LATEST;
        return switch (s.toLowerCase()) {
            case "favorites" -> FAVORITES;
            case "views" -> VIEWS;
            default -> LATEST;
        };
    }
}