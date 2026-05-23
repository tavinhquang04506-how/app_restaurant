package com.fwb.restaurant.repository;

import com.fwb.restaurant.entity.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, String> {

    Optional<Promotion> findByCodeIgnoreCase(String code);

    @Query("select p from Promotion p where p.active = true")
    List<Promotion> findAllActive();

    @Query("""
            select p from Promotion p
            where p.active = true
              and (p.startDate is null or p.startDate <= :now)
              and (p.endDate is null or p.endDate >= :now)
            """)
    List<Promotion> findAvailable(LocalDateTime now);
}

