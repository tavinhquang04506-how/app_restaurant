package com.fwb.restaurant.controller;

import com.fwb.restaurant.dto.req.booking.BookingRequest;
import com.fwb.restaurant.dto.req.booking.BookingRatingRequest;
import com.fwb.restaurant.dto.res.BookingResponse;
import com.fwb.restaurant.dto.res.TableAvailabilityResponse;
import com.fwb.restaurant.service.BookingService;
import com.fwb.restaurant.utils.annotations.ApiMessage;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping("/bookings")
    @ApiMessage("Tạo booking bàn")
    public ResponseEntity<BookingResponse> create(@RequestBody @Valid BookingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.create(request));
    }

    @PostMapping("/bookings/{id}/cancel")
    @ApiMessage("Huỷ booking")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF','USER')")
    public ResponseEntity<BookingResponse> cancel(@PathVariable String id) {
        return ResponseEntity.ok(bookingService.cancel(id));
    }

    @PostMapping("/bookings/{id}/complete")
    @ApiMessage("Hoàn thành booking")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<BookingResponse> complete(@PathVariable String id) {
        return ResponseEntity.ok(bookingService.complete(id));
    }

    @PostMapping("/bookings/{id}/check-in")
    @ApiMessage("Check-in booking")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<BookingResponse> checkIn(@PathVariable String id) {
        return ResponseEntity.ok(bookingService.checkIn(id));
    }

    @GetMapping("/bookings")
    @ApiMessage("Danh sách booking cho admin")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<List<BookingResponse>> getBookings(
            @RequestParam(required = false) String branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(bookingService.getBookings(branchId, date));
    }

    @GetMapping("/branches/{branchId}/tables/availability")
    @ApiMessage("Danh sách trạng thái bàn theo thời gian")
    public ResponseEntity<List<TableAvailabilityResponse>> getAvailability(
            @PathVariable String branchId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(defaultValue = "1") int guests,
            @RequestParam int durationMinutes
    ) {
        return ResponseEntity.ok(bookingService.getAvailability(branchId, start, guests, durationMinutes));
    }

    @GetMapping("/bookings/me")
    @ApiMessage("Danh sách booking của tôi")
    public ResponseEntity<List<BookingResponse>> getMyBookings() {
        return ResponseEntity.ok(bookingService.getMyBookings());
    }

    @PostMapping("/bookings/{id}/rate-foods")
    @ApiMessage("Đánh giá các món trong booking")
    public ResponseEntity<Void> rateFoods(
            @PathVariable String id,
            @RequestBody @Valid BookingRatingRequest request
    ) {
        bookingService.rateFoodsInBooking(id, request);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/bookings/{id}/dishes")
    @ApiMessage("Cập nhật danh sách món ăn của booking")
    public ResponseEntity<BookingResponse> updateDishes(
            @PathVariable String id,
            @RequestBody @Valid List<BookingRequest.DishRequest> request
    ) {
        return ResponseEntity.ok(bookingService.updateDishes(id, request));
    }
}

