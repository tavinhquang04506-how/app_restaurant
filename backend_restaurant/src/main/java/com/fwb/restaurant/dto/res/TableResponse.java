package com.fwb.restaurant.dto.res;

import com.fwb.restaurant.utils.enums.TableStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TableResponse {
    private String id;
    private String tableCode;
    private int capacity;
    private String location;
    private TableStatus status;
    private BranchResponse branch;
}

