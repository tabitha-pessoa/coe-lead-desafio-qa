package com.stefanini.orders.presentation.error;

import com.stefanini.orders.domain.exception.CatalogTimeoutException;
import com.stefanini.orders.domain.exception.CatalogUnavailableException;
import com.stefanini.orders.domain.exception.InvalidDiscountRuleException;
import com.stefanini.orders.domain.exception.InvalidOrderRequestException;
import com.stefanini.orders.domain.exception.NoCurrentPriceException;
import com.stefanini.orders.domain.exception.OrderNotFoundException;
import com.stefanini.orders.domain.exception.ProductInactiveException;
import com.stefanini.orders.domain.exception.ProductNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(InvalidOrderRequestException.class)
    public ResponseEntity<ErrorEnvelope> handleInvalidOrderRequest(InvalidOrderRequestException ex) {
        return respond(HttpStatus.BAD_REQUEST, ex.code(), ex.getMessage(), ex.details());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorEnvelope> handleValidation(MethodArgumentNotValidException ex) {
        List<String> details = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .toList();
        return respond(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid request payload", details);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorEnvelope> handleUnreadable(HttpMessageNotReadableException ex) {
        return respond(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Malformed request body", List.of());
    }

    @ExceptionHandler(OrderNotFoundException.class)
    public ResponseEntity<ErrorEnvelope> handleOrderNotFound(OrderNotFoundException ex) {
        return respond(HttpStatus.NOT_FOUND, ex.code(), ex.getMessage(), ex.details());
    }

    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<ErrorEnvelope> handleProductNotFound(ProductNotFoundException ex) {
        return respond(HttpStatus.UNPROCESSABLE_ENTITY, ex.code(), ex.getMessage(), ex.details());
    }

    @ExceptionHandler(ProductInactiveException.class)
    public ResponseEntity<ErrorEnvelope> handleProductInactive(ProductInactiveException ex) {
        return respond(HttpStatus.UNPROCESSABLE_ENTITY, ex.code(), ex.getMessage(), ex.details());
    }

    @ExceptionHandler(NoCurrentPriceException.class)
    public ResponseEntity<ErrorEnvelope> handleNoCurrentPrice(NoCurrentPriceException ex) {
        return respond(HttpStatus.UNPROCESSABLE_ENTITY, ex.code(), ex.getMessage(), ex.details());
    }

    @ExceptionHandler(CatalogUnavailableException.class)
    public ResponseEntity<ErrorEnvelope> handleCatalogUnavailable(CatalogUnavailableException ex) {
        log.warn("catalog_unavailable request_id={}", MDC.get("requestId"), ex);
        return respond(HttpStatus.SERVICE_UNAVAILABLE, ex.code(), "Catalog service is unavailable", List.of());
    }

    @ExceptionHandler(CatalogTimeoutException.class)
    public ResponseEntity<ErrorEnvelope> handleCatalogTimeout(CatalogTimeoutException ex) {
        log.warn("catalog_timeout request_id={}", MDC.get("requestId"), ex);
        return respond(HttpStatus.GATEWAY_TIMEOUT, ex.code(), "Catalog service timed out", List.of());
    }

    @ExceptionHandler(InvalidDiscountRuleException.class)
    public ResponseEntity<ErrorEnvelope> handleInvalidDiscountRule(InvalidDiscountRuleException ex) {
        log.error("invalid_discount_rule request_id={}", MDC.get("requestId"), ex);
        return respond(HttpStatus.INTERNAL_SERVER_ERROR, ex.code(), ex.getMessage(), ex.details());
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ErrorEnvelope> handleDatabase(DataAccessException ex) {
        log.error("database_error request_id={}", MDC.get("requestId"), ex);
        return respond(HttpStatus.INTERNAL_SERVER_ERROR, "DATABASE_ERROR", "Unexpected database error", List.of());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorEnvelope> handleUnexpected(Exception ex) {
        log.error("internal_error request_id={}", MDC.get("requestId"), ex);
        return respond(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Unexpected internal error", List.of());
    }

    private ResponseEntity<ErrorEnvelope> respond(HttpStatus status, String code, String message, List<String> details) {
        return ResponseEntity.status(status)
                .body(new ErrorEnvelope(new ApiError(code, message, details), MDC.get("requestId")));
    }
}
