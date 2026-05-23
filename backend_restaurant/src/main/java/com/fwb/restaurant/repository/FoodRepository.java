package com.fwb.restaurant.repository;

import com.fwb.restaurant.entity.Food;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface FoodRepository extends JpaRepository<Food, String>, JpaSpecificationExecutor<Food> {
    boolean existsByName(String name);
    boolean existsByNameAndIdNot(String name, String id);

}
