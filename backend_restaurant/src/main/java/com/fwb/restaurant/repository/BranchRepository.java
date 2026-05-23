package com.fwb.restaurant.repository;

import com.fwb.restaurant.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BranchRepository extends JpaRepository<Branch, String> {
    boolean existsBranchByName(String name);
    boolean existsBranchByNameAndIdNot(String name, String id);
}
