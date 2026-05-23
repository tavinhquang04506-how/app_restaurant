package com.fwb.restaurant.controller;

import com.fwb.restaurant.dto.req.user.UserCreateRequest;
import com.fwb.restaurant.dto.req.user.UserSpecRequest;
import com.fwb.restaurant.dto.req.user.UserUpdateRequest;
import com.fwb.restaurant.dto.res.PaginationResponse;
import com.fwb.restaurant.dto.res.UserResponse;
import com.fwb.restaurant.service.UserService;
import com.fwb.restaurant.utils.annotations.ApiMessage;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class UserController {

    private final UserService userService;
    
    @PostMapping("/users")
    @ApiMessage("Create user")
    public ResponseEntity<UserResponse> create(@RequestBody @Valid UserCreateRequest req) {
        
        return ResponseEntity.status(HttpStatus.CREATED).body(this.userService.create(req));
    }

    @GetMapping("/users/{id}")
    @ApiMessage("Get user by ID")
    public ResponseEntity<UserResponse> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(this.userService.getById(id));
    }

    @GetMapping("/users")
    @ApiMessage("Get users with specification")
    public ResponseEntity<PaginationResponse> getAllUser(
        @ModelAttribute UserSpecRequest userSpecRequest,
        Pageable pageable
    ) {
        return ResponseEntity.ok(this.userService.getAll(userSpecRequest, pageable));
    }

    @PutMapping("/users/{id}")
    @ApiMessage("Update user by ID")
    public ResponseEntity<UserResponse> update(
            @PathVariable("id") String id,
            @RequestBody @Valid UserUpdateRequest request) {
        
        return ResponseEntity.ok(this.userService.update(id, request));
    }

    @DeleteMapping("/users/{id}")
    @ApiMessage("Delete user by ID")
    public ResponseEntity<Void> delete(@PathVariable("id") String id) {
        this.userService.deleteById(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build(); 
    }
    
}
