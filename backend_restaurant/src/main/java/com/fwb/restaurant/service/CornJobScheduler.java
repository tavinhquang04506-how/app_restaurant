package com.fwb.restaurant.service;

import com.fwb.restaurant.entity.Booking;
import com.fwb.restaurant.utils.enums.BookingStatus;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class CornJobScheduler {

    private final ChatService chatService;
    private final BookingService bookingService;
    private final NotificationService notificationService;
    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Scheduled(cron = "0 0 * * * *")
    public void cleanExpiredMessages() {
        chatService.deleteExpiredConversations();
    }

    @Scheduled(fixedRate = 60000) // 10 phút
    @Transactional
    public void sendBookingReminders() {
        Instant now = Instant.now();

        LocalDateTime from = LocalDateTime.ofInstant(now, APP_ZONE);

        LocalDateTime to = from.plusHours(2);

        List<Booking> needRemind = bookingService
                .findReservationsToRemind(BookingStatus.CONFIRMED, from, to);

        for (Booking b : needRemind) {
            log.info("Sending reminder for booking id={}, reservedFrom={}", b.getId(), b.getReservedFrom());
            notificationService.sendBookingReminder(b);
            this.bookingService.setReminderBooking(b);
        }
    }
}

