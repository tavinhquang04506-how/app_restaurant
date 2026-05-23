package com.fwb.restaurant.utils;

import com.fwb.restaurant.config.JwtConfig;
import com.fwb.restaurant.service.RedisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SecurityUtils {

    private final JwtEncoder jwtEncoder;
    private final RedisService redisService;

    @Value("${fwb.jwt.accessToken-validity-in-second}")
    private long accessTokenExpiration;

    @Value("${fwb.jwt.refreshToken-validity-in-second}")
    private long refreshTokenExpiration;

    public String createAccessToken(Authentication authentication) {
        Instant now = Instant.now();
        Instant validity = now.plus(this.accessTokenExpiration, ChronoUnit.SECONDS);

        List<String> authorities = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuedAt(now)
            .expiresAt(validity)
            .subject(authentication.getName())
            .claim("authorities", authorities)
            .build();

        JwsHeader jwsHeader = JwsHeader.with(JwtConfig.JWT_ALGORITHM).build();
        return this.jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader, claims)).getTokenValue();

    }

    public String createRefreshToken(Authentication authentication) {
        Instant now = Instant.now();
        Instant validity = now.plus(this.refreshTokenExpiration, ChronoUnit.SECONDS);

        String jwtID = UUID.randomUUID().toString();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .id(jwtID)
                .issuedAt(now)
                .expiresAt(validity)
                .claim("type", "refresh")
                .subject(authentication.getName())
                .build();

        Duration jwtTTL = Duration.ofSeconds(this.refreshTokenExpiration);
        try {
            this.redisService.storeRefreshToken(jwtID, authentication.getName(),jwtTTL);
        } catch (Exception e) {
            log.warn("Không thể kết nối Redis, bỏ qua lưu refresh token...");
        }

        JwsHeader jwsHeader = JwsHeader.with(JwtConfig.JWT_ALGORITHM).build();
        return this.jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader, claims)).getTokenValue();
    }

    public static Optional<String> getCurrentUserLogin() {
        SecurityContext securityContext = SecurityContextHolder.getContext();
        return Optional.ofNullable(extractPrincipal(securityContext.getAuthentication()));
    }

    private static String extractPrincipal(Authentication authentication) {
        if (authentication == null) {
            return null;
        } else if (authentication.getPrincipal() instanceof UserDetails springSecurityUser) {
            return springSecurityUser.getUsername();
        } else if (authentication.getPrincipal() instanceof Jwt jwt) {
            return jwt.getSubject();
        } else if (authentication.getPrincipal() instanceof String s) {
            return s;
        }
        return null;
    }

    /**
     * Get the JWT of the current user.
     *
     * @return the JWT of the current user.
     */
    public static Optional<String> getCurrentUserJWT() {
        SecurityContext securityContext = SecurityContextHolder.getContext();
        return Optional.ofNullable(securityContext.getAuthentication())
            .filter(authentication -> authentication.getCredentials() instanceof String)
            .map(authentication -> (String) authentication.getCredentials());
    }

//    /**
//     * Check if a user is authenticated.
//     *
//     * @return true if the user is authenticated, false otherwise.
//     */
//     public static boolean isAuthenticated() {
//         Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
//         return authentication != null && getAuthorities(authentication).noneMatch(AuthoritiesConstants.ANONYMOUS::equals);
//     }

    // /**
    //  * Checks if the current user has any of the authorities.
    //  *
    //  * @param authorities the authorities to check.
    //  * @return true if the current user has any of the authorities, false otherwise.
    //  */
    // public static boolean hasCurrentUserAnyOfAuthorities(String... authorities) {
    //     Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    //     return (
    //         authentication != null && getAuthorities(authentication).anyMatch(authority -> Arrays.asList(authorities).contains(authority))
    //     );
    // }

    // /**
    //  * Checks if the current user has none of the authorities.
    //  *
    //  * @param authorities the authorities to check.
    //  * @return true if the current user has none of the authorities, false otherwise.
    //  */
    // public static boolean hasCurrentUserNoneOfAuthorities(String... authorities) {
    //     return !hasCurrentUserAnyOfAuthorities(authorities);
    // }

    // /**
    //  * Checks if the current user has a specific authority.
    //  *
    //  * @param authority the authority to check.
    //  * @return true if the current user has the authority, false otherwise.
    //  */
    // public static boolean hasCurrentUserThisAuthority(String authority) {
    //     return hasCurrentUserAnyOfAuthorities(authority);
    // }

    // private static Stream<String> getAuthorities(Authentication authentication) {
    //     return authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority);
    // }
}
