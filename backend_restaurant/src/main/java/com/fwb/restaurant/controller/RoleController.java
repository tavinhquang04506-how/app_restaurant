package com.fwb.restaurant.controller;

import com.fwb.restaurant.dto.res.DeleteResponse;
import com.fwb.restaurant.entity.Role;
import com.fwb.restaurant.service.RoleService;
import com.fwb.restaurant.utils.annotations.ApiMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class RoleController {

    private final RoleService roleService;

    @PostMapping("/roles")
    @ApiMessage("Create role")
    public ResponseEntity<Role> create(@RequestBody Role role) {
        
        return ResponseEntity.status(HttpStatus.CREATED).body(this.roleService.create(role));
    }

    @GetMapping("/roles/{id}")
    @ApiMessage("Get role by ID")
    public ResponseEntity<Role> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(this.roleService.findById(id));
    }

    @GetMapping("/roles")
    @ApiMessage("Get all roles")
    public ResponseEntity<List<Role>> getAll() {
        return ResponseEntity.ok(this.roleService.findAll());
    }

    @PutMapping("/roles/{id}")
    @ApiMessage("Update role by ID")
    public ResponseEntity<Role> update(@PathVariable("id") String id, @RequestBody Role role) {
        
        return ResponseEntity.ok(this.roleService.update(id, role));
    }

    @DeleteMapping("/roles/{id}")
    @ApiMessage("Delete role by ID")
    public ResponseEntity<DeleteResponse> delete(@PathVariable("id") String id) {
        this.roleService.delete(id);
        return ResponseEntity.ok(new DeleteResponse());
    }
}
