package com.fwb.restaurant.controller;

import com.fwb.restaurant.dto.req.promotion.PromotionRequest;
import com.fwb.restaurant.dto.res.PromotionResponse;
import com.fwb.restaurant.service.PromotionService;
import com.fwb.restaurant.utils.annotations.ApiMessage;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/promotions")
public class PromotionController {

    private final PromotionService promotionService;

    @PostMapping
    @ApiMessage("Create promotion")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PromotionResponse> create(@RequestBody @Valid PromotionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(promotionService.create(request));
    }

    @PutMapping("/{id}")
    @ApiMessage("Update promotion")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PromotionResponse> update(
            @PathVariable String id,
            @RequestBody @Valid PromotionRequest request
    ) {
        return ResponseEntity.ok(promotionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Delete promotion")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        promotionService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @ApiMessage("List of promotion")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PromotionResponse>> getAll() {
        return ResponseEntity.ok(promotionService.getAll());
    }

    @GetMapping("/available")
    @ApiMessage("Promotion available")
    public ResponseEntity<List<PromotionResponse>> getAvailable() {
        return ResponseEntity.ok(promotionService.getAvailable());
    }
}

