package com.fwb.restaurant.dto.res;

import com.fwb.restaurant.utils.enums.BookingStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
public class BookingResponse {
    private String id;
    private OffsetDateTime reservedFrom;
    private OffsetDateTime reservedTo;
    private int guests;
    private BookingStatus status;
    private String specialRequest;
    private BigDecimal subtotalAmount;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private BigDecimal depositAmount;
    private Boolean depositRefunded;
    private TableResponse table;
    private UserResponse user;
    private BranchResponse branch;
    private PromotionResponse promotion;
    private List<Dish> dishes;
    private boolean rated;

    @Data
    @Builder
    public static class Dish {
        private String id;
        private int quantity;
        private long unitPrice;
        private int servingOrder;
        private String specialNote;
        private FoodResponse food;
    }
}

