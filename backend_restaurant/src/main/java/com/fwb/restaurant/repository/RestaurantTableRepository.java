package com.fwb.restaurant.repository;

import com.fwb.restaurant.entity.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, String> {
    List<RestaurantTable> findByBranchIdAndCapacityGreaterThanEqual(String branchId, int capacity);
    boolean existsByTableCode(String code);
    List<RestaurantTable> findByBranchId(String branchId);

}

