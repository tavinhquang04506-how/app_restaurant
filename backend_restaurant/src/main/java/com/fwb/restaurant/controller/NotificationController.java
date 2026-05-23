package com.fwb.restaurant.controller;

import com.fwb.restaurant.dto.res.PaginationResponse;
import com.fwb.restaurant.service.NotificationService;
import com.fwb.restaurant.utils.annotations.ApiMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping("/notifications/global")
    @ApiMessage("Get global notifications")
    public ResponseEntity<PaginationResponse> getGlobalNotification(Pageable pageable) {
        return ResponseEntity.ok(this.notificationService.getGlobalNotifications(pageable));
    }

    @GetMapping("/notifications")
    @ApiMessage("Get my notifications")
    public ResponseEntity<PaginationResponse> getNotification(Pageable pageable) {
        return ResponseEntity.ok(this.notificationService.getMyNotifications(pageable));
    }

    @PutMapping("/notifications/{id}/read")
    @ApiMessage("Mark read notification")
    public ResponseEntity<Void> markRead(@PathVariable("id") String id) {
        this.notificationService.markRead(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/notifications/read-all")
    @ApiMessage("Mark all notifications as read")
    public ResponseEntity<Void> markAllRead() {
        this.notificationService.markAllRead();
        return ResponseEntity.ok().build();
    }
}
