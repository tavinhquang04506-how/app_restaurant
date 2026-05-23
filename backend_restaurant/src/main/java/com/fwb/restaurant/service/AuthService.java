package com.fwb.restaurant.service;

import com.fwb.restaurant.dto.req.auth.LoginRequest;
import com.fwb.restaurant.dto.res.LoginResponse;
import com.fwb.restaurant.dto.res.RefreshResponse;
import com.fwb.restaurant.entity.User;
import com.fwb.restaurant.mapper.UserMapper;
import com.fwb.restaurant.utils.SecurityUtils;
import com.fwb.restaurant.utils.UserDetailsCustom;
import com.fwb.restaurant.utils.UserDetailsServiceCustom;
import com.fwb.restaurant.utils.error.AppException;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    @Value("${google.oauth.client-id}")
    private String clientId;

    private final AuthenticationManagerBuilder authenticationManagerBuilder;
    private final UserMapper userMapper;
    private final SecurityUtils securityUtils;
    private final JwtDecoder jwtDecoder;
    private final RedisService redisService;
    private final UserDetailsServiceCustom userDetailsServiceCustom;
    private final RoleService roleService;
    private final UserService userService;


    public LoginResponse login(LoginRequest loginRequest) {
        UsernamePasswordAuthenticationToken authenticationToken
                = new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword());

        // =>>>> cần viết hàm loadUserByUsername
        Authentication authentication = authenticationManagerBuilder.getObject().authenticate(authenticationToken);

        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserDetailsCustom userDetailsCustom = (UserDetailsCustom)authentication.getPrincipal();
        log.info("Login User: {}", userDetailsCustom);
        LoginResponse.UserLoginResponse loginResponse = this.userMapper.toUserLoginResponse(userDetailsCustom);

        String access_token = this.securityUtils.createAccessToken(authentication);
        String refresh_token = this.securityUtils.createRefreshToken(authentication);

        return LoginResponse.builder()
                .user(loginResponse)
                .accessToken(access_token)
                .refreshToken(refresh_token)
                .build();
    }

    public void logout(String refreshToken) {
        Jwt jwt = jwtDecoder.decode(refreshToken);
        String type = jwt.getClaim("type");
        if (!type.equals("refresh")) {
            throw new JwtException("Invalid token type");
        }

        String jwtId = jwt.getId();
        this.redisService.revokeRefreshToken(jwtId);
    }

    public RefreshResponse refresh(String refreshToken) {
        Jwt jwt = jwtDecoder.decode(refreshToken);
        String jwtId = jwt.getId();

        String type = jwt.getClaim("type");
        if (!type.equals("refresh") || !this.redisService.isRefreshTokenValid(jwtId)) {
            throw new JwtException("Token không hợp lệ hoặc đã hết hạn.");
        }
        String subject = jwt.getSubject();
        UserDetails userDetails = this.userDetailsServiceCustom.loadUserByUsername(subject);

        Authentication authentication =
                new UsernamePasswordAuthenticationToken(
                        userDetails.getUsername(),
                        null,
                        userDetails.getAuthorities()
                );
        String access_Token = this.securityUtils.createAccessToken(authentication);

        return RefreshResponse.builder()
                .accessToken(access_Token)
                .build();

    }

    public LoginResponse loginWithGoogleIdToken(String idTokenString) {
        try {
            // 1. Verify ID token với Google
            JsonFactory jsonFactory = JacksonFactory.getDefaultInstance();
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), jsonFactory)
                    .setAudience(Collections.singletonList(clientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new AppException("ID token không hợp lệ");
            }

            // 2. Extract user info từ ID token
            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String fullName = (String) payload.get("name");
            Boolean emailVerified = payload.getEmailVerified();

            if (email == null || email.isEmpty()) {
                throw new AppException("Email không có trong ID token");
            }

            if (emailVerified != null && !emailVerified) {
                log.warn("Email chưa được verify: {}", email);
            }

            // 3. Kiểm tra user trong DB
            User user = this.userService.getUserByEmail(email);
            if (user == null) {
                // Tạo user mới
                user = new User();
                user.setEmail(email);
                user.setUsername(fullName != null ? fullName : email);
                user.setAvatarUrl("default-google.png");
                user.setRole(roleService.findByName("USER"));
                this.userService.save(user);
                log.info("Created new user from Google: {}", email);
            }

            // 4. Tạo authentication và generate tokens
            UserDetailsCustom userDetailsCustom = (UserDetailsCustom) 
                    userDetailsServiceCustom.loadUserByUsername(email);
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    userDetailsCustom.getUsername(),
                    null,
                    userDetailsCustom.getAuthorities()
            );

            String access_token = securityUtils.createAccessToken(authentication);
            String refresh_token = securityUtils.createRefreshToken(authentication);

            LoginResponse.UserLoginResponse loginResponse = 
                    userMapper.toUserLoginResponse(userDetailsCustom);

            return LoginResponse.builder()
                    .user(loginResponse)
                    .accessToken(access_token)
                    .refreshToken(refresh_token)
                    .build();

        } catch (Exception e) {
            log.error("Error processing Google login: {}", e.getMessage(), e);
            throw new AppException("Lỗi xử lý đăng nhập Google: " + e.getMessage());
        }
    }
}
