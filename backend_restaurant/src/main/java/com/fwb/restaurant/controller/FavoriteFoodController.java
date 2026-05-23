package com.fwb.restaurant.controller;

import com.fwb.restaurant.dto.req.favorite.FavoriteFoodRequest;
import com.fwb.restaurant.dto.res.FoodResponse;
import com.fwb.restaurant.service.FavoriteFoodService;
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
@PreAuthorize("hasAnyRole('USER','STAFF','ADMIN')")
public class FavoriteFoodController {

    private final FavoriteFoodService favoriteFoodService;

    @GetMapping("/favorites")
    @ApiMessage("Danh sách món yêu thích")
    public ResponseEntity<List<FoodResponse>> getFavorites() {
        return ResponseEntity.ok(favoriteFoodService.getMyFavorites());
    }

    @PostMapping("/favorites")
    @ApiMessage("Thêm món vào yêu thích")
    public ResponseEntity<FoodResponse> addFavorite(@RequestBody @Valid FavoriteFoodRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(favoriteFoodService.addFavorite(request));
    }

    @DeleteMapping("/favorites/{foodId}")
    @ApiMessage("Xoá món khỏi yêu thích")
    public ResponseEntity<Void> removeFavorite(@PathVariable String foodId) {
        favoriteFoodService.removeFavorite(foodId);
        return ResponseEntity.noContent().build();
    }
}

