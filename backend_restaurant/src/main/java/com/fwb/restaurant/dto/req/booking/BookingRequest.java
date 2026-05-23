package com.fwb.restaurant.dto.req.booking;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class BookingRequest {

    @NotNull(message = "Thời gian đặt không được để trống")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime bookingTime;

    @Min(value = 1, message = "Số khách tối thiểu là 1")
    private int guests;

    @Min(value = 30, message = "Thời gian ít nhất 30 phút")
    @Max(value = 150, message = "Thời gian tối đa 2 tiếng 30 phút")
    private int durationMinutes;

    private String specialRequest;

    @NotNull(message = "Bàn không được để trống")
    private String tableId;

    @NotNull(message = "Chi nhánh không được để trống")
    private String branchId;

    private String promotionCode;

    @Valid
    private List<DishRequest> dishes;

    @Data
    public static class DishRequest {
        @NotNull(message = "Món ăn không được để trống")
        private String foodId;

        @Min(value = 1, message = "Số lượng tối thiểu là 1")
        private int quantity;

        private Integer servingOrder;
        private String specialNote;
    }
}

