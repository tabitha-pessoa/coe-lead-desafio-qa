package com.stefanini.orders.presentation.dto;

import com.stefanini.orders.domain.port.OrderPage;

import java.util.List;

public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {

    public static <T> PageResponse<T> from(List<T> content, OrderPage page) {
        return new PageResponse<>(
                content,
                page.page(),
                page.size(),
                page.totalElements(),
                page.totalElements() == 0 ? 0 : (int) Math.ceil((double) page.totalElements() / page.size()));
    }
}
