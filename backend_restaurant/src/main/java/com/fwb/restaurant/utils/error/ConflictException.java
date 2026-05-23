package com.fwb.restaurant.utils.error;

public class ConflictException extends RuntimeException{
    public ConflictException(String message) {
        super(message);
    }
}
