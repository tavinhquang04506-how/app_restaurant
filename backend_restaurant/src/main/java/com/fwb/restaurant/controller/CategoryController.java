package com.fwb.restaurant.controller;

import com.fwb.restaurant.dto.req.category.CategoryRequest;
import com.fwb.restaurant.dto.res.CategoryResponse;
import com.fwb.restaurant.dto.res.DeleteResponse;
import com.fwb.restaurant.service.CategoryService;
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
public class CategoryController {
    private final CategoryService categoryService;

    @PostMapping("/categories")
    @ApiMessage("Create category")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryResponse> create(@RequestBody @Valid CategoryRequest categoryRequest) {

        return ResponseEntity.status(HttpStatus.CREATED).body(this.categoryService.create(categoryRequest));
    }

    @GetMapping("/categories/{id}")
    @ApiMessage("Get category by ID")
    public ResponseEntity<CategoryResponse> getByName(@PathVariable("id") String id) {
        return ResponseEntity.ok(this.categoryService.findById(id));
    }

    @GetMapping("/categories")
    @ApiMessage("Get all categories")
    public ResponseEntity<List<CategoryResponse>> getAll() {
        return ResponseEntity.ok(this.categoryService.findAll());
    }

    @PutMapping("/categories/{id}")
    @ApiMessage("Update category by ID")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryResponse> update(
            @PathVariable("id") String id,
            @RequestBody CategoryRequest categoryRequest) {

        return ResponseEntity.ok(this.categoryService.update(id, categoryRequest));
    }

    @DeleteMapping("/categories/{id}")
    @ApiMessage("Delete category by ID")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DeleteResponse> delete(@PathVariable("id") String id) {
        this.categoryService.delete(id);
        return ResponseEntity.ok(new DeleteResponse());
    }
}
