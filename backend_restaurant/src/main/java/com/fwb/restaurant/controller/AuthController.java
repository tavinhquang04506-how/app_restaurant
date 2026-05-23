package com.fwb.restaurant.controller;

import com.fwb.restaurant.dto.req.auth.GoogleIdTokenRequest;
import com.fwb.restaurant.dto.req.auth.LoginRequest;
import com.fwb.restaurant.dto.req.auth.LogoutRequest;
import com.fwb.restaurant.dto.req.auth.RefreshRequest;
import com.fwb.restaurant.dto.req.auth.RegisterRequest;
import com.fwb.restaurant.dto.res.LoginResponse;
import com.fwb.restaurant.dto.res.RefreshResponse;
import com.fwb.restaurant.dto.res.UserResponse;
import com.fwb.restaurant.service.AuthService;
import com.fwb.restaurant.service.UserService;
import com.fwb.restaurant.utils.annotations.ApiMessage;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;


@RestController
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserService userService;
    private final AuthService authService;

    @PostMapping("/auth/login")
    @ApiMessage("Login user")
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest loginRequest) {
        return ResponseEntity.ok(this.authService.login(loginRequest));
    }

    @PostMapping("/auth/logout")
    @ApiMessage("Logout user")
    public ResponseEntity<Void> logout(@RequestBody @Valid LogoutRequest logoutRequest) {
        this.authService.logout(logoutRequest.getRefreshToken());

        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @PostMapping("/auth/refresh")
    @ApiMessage("Refresh accessToken")
    public ResponseEntity<RefreshResponse> refresh(@RequestBody @Valid RefreshRequest refreshRequest) {

        return ResponseEntity.ok(this.authService.refresh(refreshRequest.getRefreshToken()));
    }

    @PostMapping("/auth/register")
    @ApiMessage("Register user")
    public ResponseEntity<UserResponse> register(@RequestBody @Valid RegisterRequest registerRequest) {
        
        return ResponseEntity.status(HttpStatus.CREATED).body(this.userService.register(registerRequest));
    }

    @PostMapping("/auth/google")
    @ApiMessage("Login with Google ID token")
    public ResponseEntity<LoginResponse> loginWithGoogle(
            @RequestBody @Valid GoogleIdTokenRequest request) {
        return ResponseEntity.ok(
                this.authService.loginWithGoogleIdToken(request.getIdToken())
        );
    }
}
