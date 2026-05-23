package com.fwb.restaurant.repository;

import com.fwb.restaurant.entity.Notification;
import com.fwb.restaurant.utils.enums.NotificationScope;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> , JpaSpecificationExecutor<Notification> {
    Page<Notification> findByScopeOrderByCreatedAtDesc(NotificationScope scope, Pageable pageable);

    Page<Notification> findByScopeAndUser_IdOrderByCreatedAtDesc(NotificationScope scope, String userid, Pageable pageable);

    @Query("SELECT n FROM Notification n WHERE n.scope = :globalScope OR (n.scope = :userScope AND n.user.id = :userId) ORDER BY n.createdAt DESC")
    Page<Notification> findAllMyAndGlobalNotifications(
            @Param("globalScope") NotificationScope globalScope,
            @Param("userScope") NotificationScope userScope,
            @Param("userId") String userId,
            Pageable pageable
    );

    List<Notification> findByScopeAndUser_IdAndReadFalse(NotificationScope scope, String userId);
}
