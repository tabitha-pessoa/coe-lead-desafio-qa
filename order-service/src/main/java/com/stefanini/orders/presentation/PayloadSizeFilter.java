package com.stefanini.orders.presentation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stefanini.orders.presentation.error.ApiError;
import com.stefanini.orders.presentation.error.ErrorEnvelope;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class PayloadSizeFilter extends OncePerRequestFilter {

    private final long maxPayloadBytes;
    private final ObjectMapper objectMapper;

    public PayloadSizeFilter(@Value("${order.max-payload-bytes:1048576}") long maxPayloadBytes,
            ObjectMapper objectMapper) {
        this.maxPayloadBytes = maxPayloadBytes;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (isPayloadTooLarge(request)) {
            response.setStatus(HttpStatus.PAYLOAD_TOO_LARGE.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getWriter(), new ErrorEnvelope(
                    new ApiError("PAYLOAD_TOO_LARGE", "Request payload exceeds the allowed size", List.of()),
                    MDC.get("requestId")));
            return;
        }
        filterChain.doFilter(request, response);
    }

    private boolean isPayloadTooLarge(HttpServletRequest request) {
        String contentLength = request.getHeader("Content-Length");
        if (contentLength == null) {
            return false;
        }
        try {
            return Long.parseLong(contentLength) > maxPayloadBytes;
        } catch (NumberFormatException e) {
            return false;
        }
    }
}
