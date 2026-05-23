package com.fwb.restaurant.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "promotions")
public class Promotion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    private String description;

    private String imageUrl;
    @Column(nullable = false)
    private int discountPercent;
    @Column(nullable = false)
    private int quantity;
    @Column(nullable = false)
    private int used = 0;

    private LocalDateTime startDate;
    private LocalDateTime endDate;

    private boolean active = true;

    public boolean isWithinPeriod(LocalDateTime now) {
        boolean afterStart = startDate == null || !now.isBefore(startDate);
        boolean beforeEnd = endDate == null || !now.isAfter(endDate);
        return afterStart && beforeEnd;
    }

    public boolean isAvailable(LocalDateTime now) {
        return active && quantity > used && isWithinPeriod(now);
    }

    public int getRemaining() {
        int remain = quantity - used;
        return Math.max(remain, 0);
    }
}

