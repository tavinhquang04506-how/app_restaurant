package com.fwb.restaurant.controller;

import com.fwb.restaurant.dto.req.table.TableRequest;
import com.fwb.restaurant.dto.res.TableResponse;
import com.fwb.restaurant.service.TableService;
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
public class TableController {

    private final TableService tableService;

    @PostMapping("/tables")
    @ApiMessage("Tạo bàn mới")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TableResponse> create(@RequestBody @Valid TableRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tableService.create(request));
    }

    @GetMapping("/branches/{branchId}/tables")
    @ApiMessage("Danh sách bàn theo chi nhánh")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<List<TableResponse>> getByBranch(@PathVariable String branchId) {
        return ResponseEntity.ok(tableService.getByBranch(branchId));
    }

    @PutMapping("/tables/{id}/status")
    @ApiMessage("Cập nhật trạng thái bàn")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<TableResponse> updateStatus(
            @PathVariable String id,
            @RequestParam String status
    ) {
        return ResponseEntity.ok(tableService.updateStatus(id, status));
    }
}

