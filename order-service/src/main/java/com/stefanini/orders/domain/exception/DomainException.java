package com.stefanini.orders.domain.exception;

import java.util.List;

public abstract class DomainException extends RuntimeException {

    private final String code;
    private final List<String> details;

    protected DomainException(String code, String message, List<String> details) {
        super(message);
        this.code = code;
        this.details = details == null ? List.of() : List.copyOf(details);
    }

    protected DomainException(String code, String message, List<String> details, Throwable cause) {
        super(message, cause);
        this.code = code;
        this.details = details == null ? List.of() : List.copyOf(details);
    }

    public String code() {
        return code;
    }

    public List<String> details() {
        return details;
    }
}
