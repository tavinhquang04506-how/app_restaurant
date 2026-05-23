package com.fwb.restaurant.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "foods")
@Getter
@Setter
public class Food extends BaseEntity{
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;
    private String description;
    private String thumbUrl;
    private long price;

    @Column(nullable = false)
    private long sold = 0;

    // Thống kê rating đơn giản cho món ăn
    @Column(name = "avg_rating")
    private Double avgRating;

    @Column(name = "rating_count")
    private Long ratingCount;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @OneToMany(mappedBy = "food")
    private List<BranchFood> branchFoods;

}
