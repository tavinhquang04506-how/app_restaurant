package com.fwb.restaurant.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Entity
@Table(name = "branch_foods")
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BranchFood {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    private long price;
    private boolean active;

    @ManyToOne
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @ManyToOne
    @JoinColumn(name = "food_id")
    private Food food;
}
