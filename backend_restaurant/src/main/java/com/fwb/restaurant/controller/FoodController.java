package com.fwb.restaurant.controller;

import com.fwb.restaurant.dto.req.food.FoodRequest;
import com.fwb.restaurant.dto.req.food.FoodSpecRequest;
import com.fwb.restaurant.dto.res.DeleteResponse;
import com.fwb.restaurant.dto.res.FoodResponse;
import com.fwb.restaurant.dto.res.PaginationResponse;
import com.fwb.restaurant.service.FoodService;
import com.fwb.restaurant.utils.annotations.ApiMessage;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.fwb.restaurant.dto.res.FoodRatingResponse;

@RestController
@RequiredArgsConstructor
public class FoodController {

    private final FoodService foodService;

    @GetMapping("/foods/{id}/ratings")
    @ApiMessage("Get food ratings")
    public ResponseEntity<List<FoodRatingResponse>> getRatings(@PathVariable("id") String id) {
        return ResponseEntity.ok(this.foodService.getRatings(id));
    }
    
    @PostMapping("/foods")
    @ApiMessage("Create food")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FoodResponse> create(@RequestBody @Valid FoodRequest foodRequest) {
        
        return ResponseEntity.status(HttpStatus.CREATED).body(this.foodService.create(foodRequest));
    }

    @GetMapping("/foods/{id}")
    @ApiMessage("Get food by ID")
    public ResponseEntity<FoodResponse> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(this.foodService.findById(id));
    }

    @GetMapping("/foods")
    @ApiMessage("Get foods with specification")
    public ResponseEntity<PaginationResponse> getAllFood(
        @ModelAttribute FoodSpecRequest foodSpecRequest,
        Pageable pageable
    ) {
        return ResponseEntity.ok(this.foodService.findAll(foodSpecRequest, pageable));
    }

    @PutMapping("/foods/{id}")
    @ApiMessage("Update food by ID")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FoodResponse> update(
            @PathVariable("id") String id,
            @RequestBody @Valid FoodRequest foodRequest) {
        
        return ResponseEntity.ok(this.foodService.update(id, foodRequest));
    }

    @DeleteMapping("/foods/{id}")
    @ApiMessage("Delete food by ID")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DeleteResponse> delete(@PathVariable("id") String id) {
        this.foodService.delete(id);
        return ResponseEntity.ok(new  DeleteResponse());
    }
    
}
