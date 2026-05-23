package com.fwb.restaurant.repository;

import com.fwb.restaurant.entity.FavoriteFood;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteFoodRepository extends JpaRepository<FavoriteFood, String> {
    List<FavoriteFood> findByUserId(String userId);
    boolean existsByUserIdAndFoodId(String userId, String foodId);
    Optional<FavoriteFood> findByUserIdAndFoodId(String userId, String foodId);
    void deleteByUserIdAndFoodId(String userId, String foodId);
}

