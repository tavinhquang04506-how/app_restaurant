package com.fwb.restaurant.controller;

import com.fwb.restaurant.dto.req.auth.ForgotPasswordRequest;
import com.fwb.restaurant.dto.req.auth.OtpVerifyRequest;
import com.fwb.restaurant.dto.req.auth.ResetPasswordRequest;
import com.fwb.restaurant.dto.req.user.MeUpdateRequest;
import com.fwb.restaurant.dto.res.UserResponse;
import com.fwb.restaurant.service.ForgotPasswordService;
import com.fwb.restaurant.service.UserService;
import com.fwb.restaurant.utils.annotations.ApiMessage;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class MeController {

    private final UserService userService;
    private final ForgotPasswordService forgotPasswordService;

    @GetMapping("/me")
    @ApiMessage("Get my profile")
    public ResponseEntity<UserResponse> getProfile() {
        return ResponseEntity.ok(this.userService.getProfile());
    }

    @PutMapping("/me")
    @ApiMessage("Update my profile")
    public ResponseEntity<UserResponse> updateProfile(@RequestBody @Valid MeUpdateRequest request) {
        return ResponseEntity.ok(this.userService.updateProfile(request));
    }

    @PostMapping("/auth/forgot-password/request")
    @ApiMessage("Request forgot password OTP")
    public ResponseEntity<Void> requestOtp(@RequestBody @Valid ForgotPasswordRequest request) {
        this.forgotPasswordService.requestOtp(request);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @PostMapping("/auth/forgot-password/verify")
    @ApiMessage("Verify forgot password OTP")
    public ResponseEntity<Void> verifyOtp(@RequestBody @Valid OtpVerifyRequest request) {
        this.forgotPasswordService.verifyOtp(request);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @PostMapping("/auth/forgot-password/reset")
    @ApiMessage("Reset password with OTP")
    public ResponseEntity<Void> resetPassword(@RequestBody @Valid ResetPasswordRequest request) {
        this.forgotPasswordService.resetPassword(request);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
