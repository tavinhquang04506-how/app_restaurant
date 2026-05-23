package com.fwb.restaurant.service;

import com.fwb.restaurant.dto.req.table.TableRequest;
import com.fwb.restaurant.dto.res.BranchResponse;
import com.fwb.restaurant.dto.res.TableResponse;
import com.fwb.restaurant.entity.Branch;
import com.fwb.restaurant.entity.RestaurantTable;
import com.fwb.restaurant.repository.BranchRepository;
import com.fwb.restaurant.repository.RestaurantTableRepository;
import com.fwb.restaurant.utils.enums.TableStatus;
import com.fwb.restaurant.utils.error.ConflictException;
import com.fwb.restaurant.utils.error.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TableService {

    private final RestaurantTableRepository tableRepository;
    private final BranchRepository branchRepository;

    public TableResponse create(TableRequest request) {
        if (tableRepository.existsByTableCode(request.getTableCode())) {
            throw new ConflictException("Mã bàn " + request.getTableCode() + " đã tồn tại");
        }
        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi nhánh"));

        RestaurantTable table = new RestaurantTable();
        table.setTableCode(request.getTableCode());
        table.setCapacity(request.getCapacity());
        table.setLocation(request.getLocation());
        table.setBranch(branch);

        return toResponse(tableRepository.save(table));
    }

    public List<TableResponse> getByBranch(String branchId) {
        return tableRepository.findByBranchId(branchId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public TableResponse updateStatus(String id, String status) {
        RestaurantTable table = getById(id);
        try {
            table.setStatus(TableStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new ConflictException("Trạng thái bàn không hợp lệ");
        }
        return toResponse(tableRepository.save(table));
    }

    public RestaurantTable getById(String id) {
        return tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bàn"));
    }

    private TableResponse toResponse(RestaurantTable table) {
        BranchResponse branchResponse = new BranchResponse();
        branchResponse.setId(table.getBranch().getId());
        branchResponse.setName(table.getBranch().getName());
        branchResponse.setAddress(table.getBranch().getAddress());
        branchResponse.setPhone(table.getBranch().getPhone());
        branchResponse.setOpenTime(table.getBranch().getOpenTime());
        branchResponse.setCloseTime(table.getBranch().getCloseTime());

        return TableResponse.builder()
                .id(table.getId())
                .tableCode(table.getTableCode())
                .capacity(table.getCapacity())
                .location(table.getLocation())
                .status(table.getStatus())
                .branch(branchResponse)
                .build();
    }
}

