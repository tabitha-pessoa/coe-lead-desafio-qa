package com.stefanini.catalog.presentation.error;

import com.stefanini.catalog.domain.exception.ProductNotFoundException;
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

    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<ErrorEnvelope> handleProductNotFound(ProductNotFoundException ex) {
        return respond(HttpStatus.NOT_FOUND, "PRODUCT_NOT_FOUND", ex.getMessage(), List.of());
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
