package com.fwb.restaurant.dto.req.table;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TableRequest {

    @NotBlank(message = "Mã bàn không được để trống")
    private String tableCode;

    @Min(value = 1, message = "Sức chứa tối thiểu là 1")
    private int capacity;

    private String location;

    @NotNull(message = "Chi nhánh không được để trống")
    private String branchId;
}

