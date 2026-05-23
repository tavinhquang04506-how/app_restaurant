package com.fwb.restaurant.repository;

import com.fwb.restaurant.entity.BranchFood;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface BranchFoodRepository extends JpaRepository<BranchFood, String> , JpaSpecificationExecutor<BranchFood> {
    boolean existsByBranchIdAndFoodId(String branchId, String foodId);
}
