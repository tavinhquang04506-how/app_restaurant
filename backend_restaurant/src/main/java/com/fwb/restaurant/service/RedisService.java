package com.fwb.restaurant.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisService {
    private final RedisTemplate<String, String> redisTemplate;

    private String buildRefreshKey(String jwtId) {
        return "refresh:" + jwtId;
    }

    private String buildOtpKey(String email) {
        return "fp:" + email;
    }

    public void storeRefreshToken(String jwtId, String email, Duration ttl) {
        try {
            String key = buildRefreshKey(jwtId);
            redisTemplate.opsForValue()
                    .set(key, email, ttl.toSeconds(), TimeUnit.SECONDS);
        } catch (Exception e) {
            log.warn("Không thể kết nối Redis để lưu refresh token: {}", e.getMessage());
        }
    }

    public boolean isRefreshTokenValid(String jwtId) {
        try {
            String key = buildRefreshKey(jwtId);
            Boolean exists = redisTemplate.hasKey(key);
            return Boolean.TRUE.equals(exists);
        } catch (Exception e) {
            log.warn("Không thể kết nối Redis để kiểm tra refresh token, cho phép token (fallback): {}", e.getMessage());
            // Fallback: nếu Redis không khả dụng, cho phép token hợp lệ (đã verify JWT signature)
            return true;
        }
    }

    public void revokeRefreshToken(String jwtId) {
        try {
            String key = buildRefreshKey(jwtId);
            redisTemplate.delete(key);
        } catch (Exception e) {
            log.warn("Không thể kết nối Redis để revoke refresh token: {}", e.getMessage());
        }
    }

    public void storeOtp(String email, String otp, Duration ttl) {
        try {
            String key = buildOtpKey(email);
            redisTemplate.opsForValue().set(key, otp, ttl.toSeconds(), TimeUnit.SECONDS);
        } catch (Exception e) {
            log.warn("Không thể kết nối Redis để lưu OTP: {}", e.getMessage());
            throw new RuntimeException("Hệ thống tạm thời không thể gửi OTP. Vui lòng thử lại sau.");
        }
    }

    public String getOtp(String email) {
        try {
            return redisTemplate.opsForValue().get(buildOtpKey(email));
        } catch (Exception e) {
            log.warn("Không thể kết nối Redis để lấy OTP: {}", e.getMessage());
            throw new RuntimeException("Hệ thống tạm thời không khả dụng. Vui lòng thử lại sau.");
        }
    }

    public void deleteOtp(String email) {
        try {
            redisTemplate.delete(buildOtpKey(email));
        } catch (Exception e) {
            log.warn("Không thể kết nối Redis để xóa OTP: {}", e.getMessage());
        }
    }
}
