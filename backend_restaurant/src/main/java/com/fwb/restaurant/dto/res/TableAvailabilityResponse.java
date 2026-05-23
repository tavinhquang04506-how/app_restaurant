package com.fwb.restaurant.dto.res;

import com.fwb.restaurant.utils.enums.TableStatus;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class TableAvailabilityResponse {
    private String tableId;
    private String tableCode;
    private int capacity;
    private TableStatus status;
    private boolean booked;
    private OffsetDateTime reservedFrom;
    private OffsetDateTime reservedTo;
}

