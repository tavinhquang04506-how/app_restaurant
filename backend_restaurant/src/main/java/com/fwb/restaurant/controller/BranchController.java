package com.fwb.restaurant.controller;

import com.fwb.restaurant.dto.req.branch.BranchRequest;
import com.fwb.restaurant.dto.res.BranchResponse;
import com.fwb.restaurant.dto.res.DeleteResponse;
import com.fwb.restaurant.service.BranchService;
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
public class BranchController {
    private final BranchService branchService;

    @PostMapping("/branches")
    @ApiMessage("Create branch")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BranchResponse> create(@RequestBody @Valid BranchRequest branchRequest) {
        return ResponseEntity.status(HttpStatus.CREATED).body(this.branchService.create(branchRequest));
    }

    @GetMapping("/branches/{id}")
    @ApiMessage("Get branch by ID")
    public ResponseEntity<BranchResponse> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(this.branchService.getById(id));
    }

    @GetMapping("/branches")
    @ApiMessage("Get branches")
    public ResponseEntity<List<BranchResponse>> getAllBranch() {
        return ResponseEntity.ok(this.branchService.getAll());
    }

    @PutMapping("/branches/{id}")
    @ApiMessage("Update branch by ID")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BranchResponse> update(
            @PathVariable("id") String id,
            @RequestBody @Valid BranchRequest request) {

        return ResponseEntity.ok(this.branchService.update(id, request));
    }

    @DeleteMapping("/branches/{id}")
    @ApiMessage("Delete branch by ID")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DeleteResponse> delete(@PathVariable("id") String id) {
        this.branchService.deleteById(id);
        return ResponseEntity.ok(new DeleteResponse());
    }

}
