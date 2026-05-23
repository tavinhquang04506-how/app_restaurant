package com.fwb.restaurant;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import com.fwb.restaurant.repository.UserRepository;
import com.fwb.restaurant.repository.RoleRepository;
import com.fwb.restaurant.repository.BranchRepository;
import com.fwb.restaurant.entity.User;
import com.fwb.restaurant.entity.Role;
import com.fwb.restaurant.entity.Branch;
import com.fwb.restaurant.utils.enums.Gender;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Optional;
import java.util.List;

@SpringBootApplication
@EnableScheduling
public class RestaurantApplication {

	public static void main(String[] args) {
		SpringApplication.run(RestaurantApplication.class, args);
	}

	@Bean
	public CommandLineRunner resetTestPasswords(
			UserRepository userRepository, 
			RoleRepository roleRepository,
			BranchRepository branchRepository,
			PasswordEncoder passwordEncoder,
			org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
		return args -> {
			// 1. Tự động seed các chi nhánh nếu chưa tồn tại
			String[][] branchSeeds = {
				{"5517b4ac-51d4-11f1-8260-088fc3077434", "Nhà hàng 3Ship - Quận 1", "123 Lê Lợi, Quận 1, TP.HCM", "0901234567"},
				{"5517ba1e-51d4-11f1-8260-088fc3077434", "Nhà hàng 3Ship - Quận 3", "456 Võ Văn Tần, Quận 3, TP.HCM", "0907654321"},
				{"5517c003-51d4-11f1-8260-088fc3077434", "Nhà hàng 3Ship - Bình Thạnh", "789 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM", "0908889999"},
				{"5517c004-51d4-11f1-8260-088fc3077434", "Nhà hàng 3Ship - Gò Vấp", "321 Quang Trung, Quận Gò Vấp, TP.HCM", "0901112222"}
			};

			for (String[] seed : branchSeeds) {
				String id = seed[0];
				String name = seed[1];
				String address = seed[2];
				String phone = seed[3];
				if (!branchRepository.existsById(id)) {
					String sql = "INSERT INTO branches (id, name, address, phone, image_url, open_time, close_time, created_at, updated_at, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 'system', 'system')";
					jdbcTemplate.update(sql, id, name, address, phone, "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4", java.sql.Time.valueOf("09:00:00"), java.sql.Time.valueOf("23:00:00"));
					System.out.println(">>> [AUTO SEED] Created branch '" + name + "' successfully using JDBC!");
				}
			}

			// Đồng bộ hóa toàn bộ các chi nhánh hiện có về giờ mở/đóng cửa 09:00 - 23:00
			jdbcTemplate.update("UPDATE branches SET open_time = ?, close_time = ?", java.sql.Time.valueOf("09:00:00"), java.sql.Time.valueOf("23:00:00"));
			System.out.println(">>> [AUTO SYNC] Enforced all branch times to 09:00 - 23:00 successfully!");

			// 2. Tự động kiểm tra và tạo vai trò MANAGER nếu chưa tồn tại
			Optional<Role> managerRoleOpt = roleRepository.findAll().stream()
					.filter(r -> "MANAGER".equalsIgnoreCase(r.getName()))
					.findFirst();
			Role managerRole;
			if (managerRoleOpt.isEmpty()) {
				Role newRole = new Role();
				newRole.setName("MANAGER");
				managerRole = roleRepository.save(newRole);
				System.out.println(">>> [AUTO SEED] Created role 'MANAGER' successfully!");
			} else {
				managerRole = managerRoleOpt.get();
			}

			Optional<Role> staffRoleOpt = roleRepository.findAll().stream()
					.filter(r -> "STAFF".equalsIgnoreCase(r.getName()))
					.findFirst();
			Role staffRole = staffRoleOpt.orElse(null);

			Branch branch1 = branchRepository.findById("5517b4ac-51d4-11f1-8260-088fc3077434").orElse(null);
			Branch branch2 = branchRepository.findById("5517ba1e-51d4-11f1-8260-088fc3077434").orElse(null);

			// 3. Tự động kiểm tra và tạo tài khoản manager@gmail.com nếu chưa có
			Optional<User> managerOpt = userRepository.findByEmail("manager@gmail.com");
			if (managerOpt.isEmpty()) {
				User manager = new User();
				manager.setEmail("manager@gmail.com");
				manager.setUsername("Lê Thanh Tùng");
				manager.setPhone("0999555444");
				manager.setGender(Gender.MALE);
				manager.setAvatarUrl("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d");
				manager.setRole(managerRole);
				manager.setBranch(branch1);
				manager.setPassword(passwordEncoder.encode("123456"));
				userRepository.save(manager);
				System.out.println(">>> [AUTO SEED] Created user 'manager@gmail.com' successfully!");
			}

			// 4. Tự động kiểm tra và tạo tài khoản manager2@gmail.com nếu chưa có
			Optional<User> manager2Opt = userRepository.findByEmail("manager2@gmail.com");
			if (manager2Opt.isEmpty()) {
				User manager2 = new User();
				manager2.setEmail("manager2@gmail.com");
				manager2.setUsername("Trần Minh Đức");
				manager2.setPhone("0999444333");
				manager2.setGender(Gender.MALE);
				manager2.setAvatarUrl("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d");
				manager2.setRole(managerRole);
				manager2.setBranch(branch2);
				manager2.setPassword(passwordEncoder.encode("123456"));
				userRepository.save(manager2);
				System.out.println(">>> [AUTO SEED] Created user 'manager2@gmail.com' successfully!");
			}

			// 5. Tự động kiểm tra và tạo tài khoản staff2@gmail.com nếu chưa có
			Optional<User> staff2Opt = userRepository.findByEmail("staff2@gmail.com");
			if (staff2Opt.isEmpty() && staffRole != null) {
				User staff2 = new User();
				staff2.setEmail("staff2@gmail.com");
				staff2.setUsername("Nguyễn Thị Thu Hà");
				staff2.setPhone("0999333222");
				staff2.setGender(Gender.FEMALE);
				staff2.setAvatarUrl("https://images.unsplash.com/photo-1581299894007-aaa50297cf16");
				staff2.setRole(staffRole);
				staff2.setBranch(branch2);
				staff2.setPassword(passwordEncoder.encode("123456"));
				userRepository.save(staff2);
				System.out.println(">>> [AUTO SEED] Created user 'staff2@gmail.com' successfully!");
			}

			// 6. Reset mật khẩu cho các tài khoản test về '123456'
			String[] testEmails = {"admin@gmail.com", "manager@gmail.com", "manager2@gmail.com", "staff@gmail.com", "staff2@gmail.com", "test@gmail.com"};
			for (String email : testEmails) {
				Optional<User> userOpt = userRepository.findByEmail(email);
				if (userOpt.isPresent()) {
					User user = userOpt.get();
					user.setPassword(passwordEncoder.encode("123456"));
					userRepository.save(user);
					System.out.println(">>> [RESET PASSWORD] Reset password for " + email + " to '123456' successfully!");
				} else {
					System.out.println(">>> [RESET PASSWORD] User not found: " + email);
				}
			}

			// 7. Đồng bộ/áp đặt tên tiếng Việt thật cho các tài khoản thử nghiệm nếu họ đã được tạo trước đó
			jdbcTemplate.update("UPDATE users SET username = 'Nguyễn Hoàng Nam' WHERE email = 'admin@gmail.com'");
			jdbcTemplate.update("UPDATE users SET username = 'Phan Thị Tuyết Mai' WHERE email = 'staff@gmail.com'");
			jdbcTemplate.update("UPDATE users SET username = 'Lê Thanh Tùng' WHERE email = 'manager@gmail.com'");
			jdbcTemplate.update("UPDATE users SET username = 'Trần Minh Đức' WHERE email = 'manager2@gmail.com'");
			jdbcTemplate.update("UPDATE users SET username = 'Nguyễn Thị Thu Hà' WHERE email = 'staff2@gmail.com'");
			System.out.println(">>> [AUTO SYNC] Enforced all test account usernames to real Vietnamese names successfully!");
		};
	}

}
