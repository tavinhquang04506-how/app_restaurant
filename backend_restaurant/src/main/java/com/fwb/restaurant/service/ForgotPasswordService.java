package com.fwb.restaurant.service;

import com.fwb.restaurant.dto.req.auth.ForgotPasswordRequest;
import com.fwb.restaurant.dto.req.auth.OtpVerifyRequest;
import com.fwb.restaurant.dto.req.auth.ResetPasswordRequest;
import com.fwb.restaurant.entity.User;
import com.fwb.restaurant.repository.UserRepository;
import com.fwb.restaurant.utils.error.ConflictException;
import com.fwb.restaurant.utils.error.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class ForgotPasswordService {

    private final UserRepository userRepository;
    private final RedisService redisService;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;

    private static final Duration OTP_TTL = Duration.ofMinutes(10);
    private static final SecureRandom RANDOM = new SecureRandom();

    public void requestOtp(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Email không tồn tại"));

        String otp = generateOtp();
        redisService.storeOtp(user.getEmail(), otp, OTP_TTL);

        this.mailService.sendForgotPasswordOtp(user.getEmail(), otp);
    }

    public void verifyOtp(OtpVerifyRequest request) {
        String cachedOtp = redisService.getOtp(request.getEmail());
        if (cachedOtp == null || !cachedOtp.equals(request.getOtp())) {
            throw new ConflictException("Mã OTP không hợp lệ hoặc đã hết hạn");
        }
    }

    public void resetPassword(ResetPasswordRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new ConflictException("Mật khẩu xác nhận không khớp");
        }

        String cachedOtp = redisService.getOtp(request.getEmail());
        if (cachedOtp == null || !cachedOtp.equals(request.getOtp())) {
            throw new ConflictException("Mã OTP không hợp lệ hoặc đã hết hạn");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Email không tồn tại"));

        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);
        redisService.deleteOtp(request.getEmail());
    }

    private String generateOtp() {
        int number = RANDOM.nextInt(900_000) + 100_000;
        return String.valueOf(number);
    }
}

