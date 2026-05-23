package com.fwb.restaurant.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity(securedEnabled = true)
public class SecurityConfiguration {
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http , 
                CustomAuthenticationEntryPoint customAuthenticationEntryPoint) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(
                authz -> authz
                    .requestMatchers("/auth/login" , "/auth/refresh", "/storage/**", "/auth/register").permitAll()
                    .requestMatchers("/auth/google/**").permitAll()
                    .requestMatchers("/auth/forgot-password/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/branches", "/branches/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/promotions", "/promotions/**").permitAll()
                    .requestMatchers("/ws-chat/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/foods", "/foods/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/branches-foods", "/branches-foods/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/categories", "/categories/**").permitAll()
                    .anyRequest().authenticated())
                    .oauth2ResourceServer((oauth2) -> oauth2.jwt(Customizer.withDefaults())
                        .authenticationEntryPoint(customAuthenticationEntryPoint))
                    // .exceptionHandling(
                    //     exceptions -> exceptions
                    //             .authenticationEntryPoint(new BearerTokenAuthenticationEntryPoint()) //401
                    //             .accessDeniedHandler(new BearerTokenAccessDeniedHandler())) //403

            .formLogin(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
            
        return http.build();
    }
}
