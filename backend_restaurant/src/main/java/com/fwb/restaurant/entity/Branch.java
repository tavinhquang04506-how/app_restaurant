package com.fwb.restaurant.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;
import java.util.List;


@Entity
@Table(name = "branches")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Branch extends BaseEntity{
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;
    private String address;
    private String phone;
    private String imageUrl;
    private LocalTime openTime;
    private LocalTime closeTime;

    @OneToMany(mappedBy = "branch")
    private List<User> admins;

    @OneToMany(mappedBy = "branch")
    private List<BranchFood> branchFoods;
}
