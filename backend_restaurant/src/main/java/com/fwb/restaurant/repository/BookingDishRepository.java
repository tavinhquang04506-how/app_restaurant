package com.fwb.restaurant.repository;

import com.fwb.restaurant.entity.BookingDish;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookingDishRepository extends JpaRepository<BookingDish, String> {
}

