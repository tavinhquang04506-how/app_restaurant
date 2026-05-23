package com.fwb.restaurant.controller;

import com.fwb.restaurant.dto.req.branchfood.BranchFoodActiveUpdate;
import com.fwb.restaurant.dto.req.branchfood.BranchFoodPriceUpdate;
import com.fwb.restaurant.dto.req.branchfood.BranchFoodRequest;
import com.fwb.restaurant.dto.req.branchfood.BranchFoodSpecRequest;
import com.fwb.restaurant.dto.res.BranchFoodResponse;
import com.fwb.restaurant.dto.res.DeleteResponse;
import com.fwb.restaurant.dto.res.PaginationResponse;
import com.fwb.restaurant.service.BranchFoodService;
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
public class BranchFoodController {

    private final BranchFoodService branchFoodService;

    @PostMapping("/branches-foods")
    @ApiMessage("Create branch_food")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BranchFoodResponse> create(@RequestBody @Valid BranchFoodRequest branchFoodRequest) {
        return ResponseEntity.status(HttpStatus.CREATED).body(this.branchFoodService.create(branchFoodRequest));
    }

    @GetMapping("/branches-foods")
    @ApiMessage("Get branches")
    public ResponseEntity<PaginationResponse> getAllBranch(
            @ModelAttribute BranchFoodSpecRequest branchFoodSpecRequest,
            Pageable pageable
    ) {
        return ResponseEntity.ok(this.branchFoodService.getAll(branchFoodSpecRequest, pageable));
    }

    @PutMapping("/branch-food/{id}/active")
    @ApiMessage("Set active branch-food")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<BranchFoodResponse> updateActive(
            @PathVariable("id") String id,
            @RequestBody @Valid BranchFoodActiveUpdate branchFoodActiveUpdate) {

        return ResponseEntity.ok(this.branchFoodService.setActive(id,branchFoodActiveUpdate));
    }

    @PutMapping("/branch-food/{id}/price")
    @ApiMessage("Set active branch-food")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<BranchFoodResponse> updatePrice(
            @PathVariable("id") String id,
            @RequestBody @Valid BranchFoodPriceUpdate branchFoodPriceUpdate
    ) {

        return ResponseEntity.ok(this.branchFoodService.setPrice(id, branchFoodPriceUpdate));
    }

    @DeleteMapping("/branch-food/{id}")
    @ApiMessage("Delete branch by ID")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DeleteResponse> delete(@PathVariable("id") String id) {
        this.branchFoodService.deleteById(id);
        return ResponseEntity.ok(new DeleteResponse());
    }
}
