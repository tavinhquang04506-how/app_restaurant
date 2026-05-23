package com.fwb.restaurant.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.fwb.restaurant.dto.req.auth.RegisterRequest;
import com.fwb.restaurant.dto.req.user.MeUpdateRequest;
import com.fwb.restaurant.dto.req.user.UserCreateRequest;
import com.fwb.restaurant.dto.req.user.UserSpecRequest;
import com.fwb.restaurant.dto.req.user.UserUpdateRequest;
import com.fwb.restaurant.dto.res.PaginationResponse;
import com.fwb.restaurant.dto.res.UserResponse;
import com.fwb.restaurant.entity.Branch;
import com.fwb.restaurant.entity.Role;
import com.fwb.restaurant.entity.User;
import com.fwb.restaurant.mapper.UserMapper;
import com.fwb.restaurant.repository.BranchRepository;
import com.fwb.restaurant.repository.UserRepository;
import com.fwb.restaurant.specification.GenericSpecification;
import com.fwb.restaurant.utils.SecurityUtils;
import com.fwb.restaurant.utils.error.ConflictException;
import com.fwb.restaurant.utils.error.ResourceNotFoundException;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final RoleService roleService;
    private final BranchRepository branchRepository;

    public UserResponse create(UserCreateRequest req) {
        if(this.userRepository.existsByEmail(req.getEmail())) {
            throw new ConflictException("Email : " + req.getEmail() + " đã tồn tại" );
        }

        Role role = this.roleService.findByName(req.getRole().getName());
        
        // RBAC Check for MANAGER
        User currentUser = getCurrentUser();
        if ("MANAGER".equalsIgnoreCase(currentUser.getRole().getName())) {
            if (!"STAFF".equalsIgnoreCase(role.getName())) {
                throw new ConflictException("Quản lý chỉ có quyền tạo tài khoản Nhân viên");
            }
            if (currentUser.getBranch() == null) {
                throw new ConflictException("Tài khoản Quản lý hiện tại chưa thuộc chi nhánh nào");
            }
            // Force branchId to be manager's branchId
            req.setBranchId(currentUser.getBranch().getId());
        }

        Branch branch = resolveBranch(req.getBranchId(), role);

        User userCreate = this.userMapper.toUser(req);
        userCreate.setPassword(passwordEncoder.encode(req.getPassword()));
        userCreate.setRole(role);
        userCreate.setBranch(branch);

        User userDB = this.userRepository.save(userCreate);

        return this.userMapper.toUserResponse(userDB);
    }

    public UserResponse register(RegisterRequest req) {
        if(this.userRepository.existsByEmail(req.getEmail())) {
            throw new ConflictException("Email : " + req.getEmail() + " đã tồn tại" );
        }

        Role role = this.roleService.findByName("USER");

        User userCreate = this.userMapper.toUser(req);
        userCreate.setPassword(passwordEncoder.encode(req.getPassword()));
        userCreate.setRole(role);

        return this.userMapper.toUserResponse(this.userRepository.save(userCreate));
    }

    public PaginationResponse getAll(UserSpecRequest userSpecRequest, Pageable pageable) {
        Specification<User> spec = GenericSpecification.filter(userSpecRequest);
        
        // RBAC check for MANAGER
        User currentUser = getCurrentUser();
        if ("MANAGER".equalsIgnoreCase(currentUser.getRole().getName())) {
            Specification<User> managerSpec = (root, query, cb) -> {
                Join<User, Role> roleJoin = root.join("role");
                Join<User, Branch> branchJoin = root.join("branch", JoinType.LEFT);
                
                return cb.and(
                    cb.equal(roleJoin.get("name"), "STAFF"),
                    cb.equal(branchJoin.get("id"), currentUser.getBranch() != null ? currentUser.getBranch().getId() : "")
                );
            };
            spec = spec.and(managerSpec);
        }
        
        Page<User> page = userRepository.findAll(spec, pageable);

        PaginationResponse.Meta meta = PaginationResponse.Meta.builder()
                .page(page.getNumber() + 1)
                .pageSize(page.getSize())
                .pages(page.getTotalPages())
                .total(page.getTotalElements())
                .build();

        List<UserResponse> result = page.getContent().stream().map(userMapper::toUserResponse).toList();

        return PaginationResponse.builder()
                .meta(meta)
                .result(result)
                .build();
    }

    public UserResponse getById(String id) {
        User userDB = this.userRepository.findById(id)
            .orElseThrow( () -> new ResourceNotFoundException("ID " + id + " không tồn tại"));
  
        return this.userMapper.toUserResponse(userDB);
    }

    public UserResponse getByEmail(String email) {
        User userDB = this.userRepository.findByEmail(email)
            .orElseThrow( () -> new ResourceNotFoundException("Email " + email + " không tồn tại"));

        return this.userMapper.toUserResponse(userDB);
    }

    public User getUserByEmail(String email) {
        return this.userRepository.findByEmail(email).orElse(null);
    }

    public void save(User user) {
        this.userRepository.save(user);
    }

    public UserResponse update(String id, UserUpdateRequest request) {
        User userDB = this.userRepository.findById(id).orElseThrow(
            () -> new ResourceNotFoundException("Id : " + id + " không tồn tại" ));

        Role role = this.roleService.findById(request.getRoleId());
        Branch branch = resolveBranch(request.getBranchId(), role);

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            request.setPassword(passwordEncoder.encode(request.getPassword()));
        } else {
            request.setPassword(null);
        }
        this.userMapper.updateUser(request, userDB);
        userDB.setRole(role);
        userDB.setBranch(branch);
        this.userRepository.save(userDB);

        return this.userMapper.toUserResponse(userDB);
    }

    public void deleteById(String id) {
        if(!this.userRepository.existsById(id)) {
            throw new ResourceNotFoundException("Id : " + id + " không tồn tại");
        }
        this.userRepository.deleteById(id);
    }

    public UserResponse getProfile() {
        User currentUser = getCurrentUser();
        return this.userMapper.toUserResponse(currentUser);
    }

    public UserResponse updateProfile(MeUpdateRequest request) {
        User currentUser = getCurrentUser();

        currentUser.setUsername(request.getUsername());
        currentUser.setPhone(request.getPhone());
        // Only update avatar if explicitly provided (preserve existing avatar when null)
        if (request.getAvatarUrl() != null) {
            currentUser.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getGender() != null) {
            currentUser.setGender(request.getGender());
        }

        this.userRepository.save(currentUser);
        return this.userMapper.toUserResponse(currentUser);
    }

    private Branch resolveBranch(String branchId, Role role) {
        if (branchId == null || branchId.isBlank()) {
            if ("STAFF".equalsIgnoreCase(role.getName()) || "MANAGER".equalsIgnoreCase(role.getName())) {
                throw new ConflictException("Nhân viên hoặc Quản lý phải thuộc một chi nhánh");
            }
            return null;
        }
        return branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi nhánh"));
    }

    private User getCurrentUser() {
        String email = SecurityUtils.getCurrentUserLogin()
                .orElseThrow(() -> new ResourceNotFoundException("Vui lòng đăng nhập"));
        return this.userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
    }
}
