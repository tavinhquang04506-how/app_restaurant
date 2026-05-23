package com.fwb.restaurant.entity;

import com.fwb.restaurant.utils.enums.TableStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "tables")
public class RestaurantTable extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "table_code", unique = true, nullable = false)
    private String tableCode;

    private int capacity;

    private String location;

    @Enumerated(EnumType.STRING)
    private TableStatus status = TableStatus.AVAILABLE;

    @ManyToOne
    @JoinColumn(name = "branch_id")
    private Branch branch;
}

