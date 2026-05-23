package com.fwb.restaurant.mapper;

import com.fwb.restaurant.dto.req.branch.BranchRequest;
import com.fwb.restaurant.dto.res.BranchResponse;
import com.fwb.restaurant.entity.Branch;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface BranchMapper {
    BranchResponse toBranchResponse(Branch branch);
    Branch toBranch(BranchRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateBranch(BranchRequest request, @MappingTarget Branch branch);
}
