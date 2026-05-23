package com.fwb.restaurant.repository;

import com.fwb.restaurant.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, String> {
    boolean existsByName(String name);
    boolean existsByNameAndIdNot(String name, String id);

}
