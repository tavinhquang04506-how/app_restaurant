package com.fwb.restaurant.service;

import com.fwb.restaurant.dto.req.branch.BranchRequest;
import com.fwb.restaurant.dto.res.BranchResponse;
import com.fwb.restaurant.entity.Branch;
import com.fwb.restaurant.mapper.BranchMapper;
import com.fwb.restaurant.repository.BranchRepository;
import com.fwb.restaurant.utils.error.ConflictException;
import com.fwb.restaurant.utils.error.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BranchService {
    private final BranchMapper branchMapper;
    private final BranchRepository branchRepository;

    public BranchResponse create(BranchRequest request) {
        if(this.branchRepository.existsBranchByName(request.getName())) {
            throw new ConflictException("Chi nhánh : " +  request.getName() + " đã tồn tại...");
        }

        Branch branch = this.branchMapper.toBranch(request);
        return branchMapper.toBranchResponse(this.branchRepository.save(branch));
    }

    public BranchResponse getById(String id) {
        Branch branch = this.branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi nhánh này !!!"));

        return this.branchMapper.toBranchResponse(branch);
    }

    public List<BranchResponse> getAll() {
        List<Branch> branches = this.branchRepository.findAll();
        return branches.stream().map(branchMapper::toBranchResponse).toList();
    }

    public BranchResponse update(String id, BranchRequest request) {
        Branch branch = this.branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi nhánh này !!!"));

        if(this.branchRepository.existsBranchByNameAndIdNot(request.getName(), id)) {
            throw new ConflictException("Chi nhánh : " +  request.getName() + " đã tồn tại...");
        }

        this.branchMapper.updateBranch(request, branch);
        this.branchRepository.save(branch);
        return this.branchMapper.toBranchResponse(branch);
    }

    public void deleteById(String id) {
        if(!this.branchRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy chi nhánh này !!!");
        }

        this.branchRepository.deleteById(id);
    }

}
