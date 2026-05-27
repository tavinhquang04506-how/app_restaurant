package com.fwb.restaurant.repository;

import com.fwb.restaurant.entity.Booking;
import com.fwb.restaurant.utils.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {

    @Query("""
        SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END
        FROM Booking b
        WHERE b.table.id = :tableId
          AND b.status IN :statuses
          AND b.reservedFrom < :endTime
          AND b.reservedTo > :startTime
    """)
    boolean existsOverlap(@Param("tableId") String tableId,
                          @Param("statuses") Collection<BookingStatus> statuses,
                          @Param("startTime") LocalDateTime startTime,
                          @Param("endTime") LocalDateTime endTime);

    @Query("""
        SELECT b
        FROM Booking b
        WHERE b.branch.id = :branchId
          AND b.status IN :statuses
          AND b.reservedFrom < :endTime
          AND b.reservedTo > :startTime
    """)
    List<Booking> findOverlapsByBranch(@Param("branchId") String branchId,
                                       @Param("statuses") Collection<BookingStatus> statuses,
                                       @Param("startTime") LocalDateTime startTime,
                                       @Param("endTime") LocalDateTime endTime);

    @Query("""
        SELECT b
        FROM Booking b
        WHERE b.status IN :statuses
          AND (:branchId IS NULL OR b.branch.id = :branchId)
          AND b.reservedFrom >= :startTime
          AND b.reservedFrom < :endTime
        ORDER BY b.reservedFrom ASC
    """)
    List<Booking> findByBranchAndTimeRange(@Param("branchId") String branchId,
                                           @Param("statuses") Collection<BookingStatus> statuses,
                                           @Param("startTime") LocalDateTime startTime,
                                           @Param("endTime") LocalDateTime endTime);

    List<Booking> findByUserIdOrderByReservedFromDesc(String userId);

    @Query("""
        SELECT b
        FROM Booking b
        WHERE b.status = :status
          AND b.reservedFrom BETWEEN :from AND :to
          AND b.reminder = false 
    """)
    List<Booking> findReservationsToRemind(
            @Param("status") BookingStatus status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    List<Booking> findByStatusAndReservedFromBefore(BookingStatus status, LocalDateTime dateTime);
}

