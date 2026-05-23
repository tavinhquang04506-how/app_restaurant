package com.fwb.restaurant.service;

import java.util.List;

import com.fwb.restaurant.utils.error.ConflictException;
import org.springframework.stereotype.Service;

import com.fwb.restaurant.entity.Role;
import com.fwb.restaurant.repository.RoleRepository;
import com.fwb.restaurant.utils.error.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoleService {
    private final RoleRepository roleRepository;

    public Role create(Role role) {
        if (this.roleRepository.existsByName(role.getName())) {
            throw new ConflictException("Role : " + role.getName() + " đã tồn tại");
        }
        role.setName(role.getName().toUpperCase());
        return this.roleRepository.save(role);
    }

    public Role findById(String id) {
        return this.roleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Id : " + id + " không tồn tại"));
    }

    public Role findByName(String name) {
        return this.roleRepository.findByName(name)
            .orElseThrow(() -> new ResourceNotFoundException("Role : " + name + " không tồn tại"));
    }

    public List<Role> findAll() {
        return this.roleRepository.findAll();
    }

    public Role update(String id, Role role) {
        Role roleDB = this.findById(id);
        roleDB.setName(role.getName());
        return this.roleRepository.save(roleDB);
    }

    public void delete(String id) {
        this.findById(id);
        this.roleRepository.deleteById(id);
    }
}
