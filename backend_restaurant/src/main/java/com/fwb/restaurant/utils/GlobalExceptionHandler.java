package com.fwb.restaurant.utils;

import com.fwb.restaurant.dto.RestResponse;
import com.fwb.restaurant.utils.error.ConflictException;
import com.fwb.restaurant.utils.error.ResourceNotFoundException;
import com.fwb.restaurant.utils.error.StorageException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AuthorizationDeniedException.class)
    public ResponseEntity<RestResponse<Object>> handleAccessDenied(AuthorizationDeniedException ex) {
        RestResponse<Object> res = RestResponse.builder()
                .statusCode(HttpStatus.FORBIDDEN.value())
                .error("Access Denied")
                .message("Bạn không có quyền truy cập tài nguyên này")
                .build();

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(res);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<RestResponse<Object>> handleException(Exception e) {
        RestResponse<Object> res = RestResponse.builder()
                .statusCode(HttpStatus.BAD_REQUEST.value())
                .error(e.getMessage())
                .message("Có lỗi xảy ra....")
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<RestResponse<Object>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        RestResponse<Object> res = RestResponse.builder()
                .statusCode(HttpStatus.NOT_FOUND.value())
                .error("Resource not found...")
                .message(ex.getMessage())
                .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(res);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<RestResponse<Object>> handleConflictException(ConflictException ex) {
        RestResponse<Object> res = RestResponse.builder()
                .statusCode(HttpStatus.CONFLICT.value())
                .error("Conflict Exception...")
                .message(ex.getMessage())
                .build();

        return ResponseEntity.status(HttpStatus.CONFLICT).body(res);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<RestResponse<Object>> handleDataIntegrity(DataIntegrityViolationException ex) {
        RestResponse<Object> res = RestResponse.builder()
                .statusCode(HttpStatus.CONFLICT.value())
                .error(ex.getMessage())
                .message("Dữ liệu vi phạm ràng buộc (có thể bị trùng)")
                .build();

        return ResponseEntity.status(HttpStatus.CONFLICT).body(res);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<RestResponse<Object>> handleValidationException(MethodArgumentNotValidException ex) {
        final List<FieldError> fieldErrors = ex.getFieldErrors();
        List<String> errors = fieldErrors.stream().map(FieldError::getDefaultMessage).toList();

        RestResponse<Object> res = RestResponse.builder()
                .statusCode(HttpStatus.BAD_REQUEST.value())
                .error("Invalid Request Content...")
                .message(errors.size() > 1 ? errors : errors.getFirst())
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<RestResponse<Object>> handleBadCredentialsException(BadCredentialsException ex) {
        RestResponse<Object> res = RestResponse.builder()
                .statusCode(HttpStatus.UNAUTHORIZED.value())
                .error(ex.getMessage())
                .message("Tài khoản hoặc mật khẩu không đúng !!!")
                .build();

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(res);
    }

    @ExceptionHandler(JwtException.class)
    public ResponseEntity<RestResponse<Object>> handleJwtException(JwtException ex) {
        RestResponse<Object> res = RestResponse.builder()
                .statusCode(HttpStatus.UNAUTHORIZED.value())
                .error("Jwt Invalid Or Expired...")
                .message(ex.getMessage())
                .build();

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(res);
    }

    @ExceptionHandler(StorageException.class)
    public ResponseEntity<RestResponse<Object>> handleStorageException(StorageException ex) {
        RestResponse<Object> res = RestResponse.builder()
                .statusCode(HttpStatus.BAD_REQUEST.value())
                .error("Upload file exception...")
                .message(ex.getMessage())
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }
}
