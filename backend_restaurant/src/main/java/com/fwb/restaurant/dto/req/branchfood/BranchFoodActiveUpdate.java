package com.fwb.restaurant.dto.req.branchfood;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BranchFoodActiveUpdate {
    private boolean active;
}
