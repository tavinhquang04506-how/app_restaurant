package com.fwb.restaurant.repository;

import com.fwb.restaurant.entity.FoodRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FoodRatingRepository extends JpaRepository<FoodRating, String> {
    List<FoodRating> findByFoodIdOrderByCreatedAtDesc(String foodId);
    boolean existsByBookingId(String bookingId);
}


