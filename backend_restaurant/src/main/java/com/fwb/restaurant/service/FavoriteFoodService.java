package com.fwb.restaurant.service;

import com.fwb.restaurant.dto.req.favorite.FavoriteFoodRequest;
import com.fwb.restaurant.dto.res.FoodResponse;
import com.fwb.restaurant.entity.FavoriteFood;
import com.fwb.restaurant.entity.Food;
import com.fwb.restaurant.entity.User;
import com.fwb.restaurant.mapper.FoodMapper;
import com.fwb.restaurant.repository.FavoriteFoodRepository;
import com.fwb.restaurant.repository.FoodRepository;
import com.fwb.restaurant.repository.UserRepository;
import com.fwb.restaurant.utils.SecurityUtils;
import com.fwb.restaurant.utils.error.ConflictException;
import com.fwb.restaurant.utils.error.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class FavoriteFoodService {

    private final FavoriteFoodRepository favoriteFoodRepository;
    private final FoodRepository foodRepository;
    private final UserRepository userRepository;
    private final FoodMapper foodMapper;

    public List<FoodResponse> getMyFavorites() {
        User user = getCurrentUser();
        return favoriteFoodRepository.findByUserId(user.getId()).stream()
                .map(favorite -> foodMapper.toFoodResponse(favorite.getFood()))
                .toList();
    }

    public FoodResponse addFavorite(FavoriteFoodRequest request) {
        User user = getCurrentUser();
        Food food = foodRepository.findById(request.getFoodId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn"));

        boolean exists = favoriteFoodRepository.existsByUserIdAndFoodId(user.getId(), food.getId());
        if (exists) {
            throw new ConflictException("Món ăn đã nằm trong danh sách yêu thích");
        }

        FavoriteFood favorite = new FavoriteFood();
        favorite.setUser(user);
        favorite.setFood(food);
        favoriteFoodRepository.save(favorite);

        return foodMapper.toFoodResponse(food);
    }

    public void removeFavorite(String foodId) {
        User user = getCurrentUser();
        FavoriteFood favorite = favoriteFoodRepository.findByUserIdAndFoodId(user.getId(), foodId)
                .orElseThrow(() -> new ResourceNotFoundException("Món ăn không tồn tại trong yêu thích"));
        favoriteFoodRepository.delete(favorite);
    }

    private User getCurrentUser() {
        String email = SecurityUtils.getCurrentUserLogin()
                .orElseThrow(() -> new ResourceNotFoundException("Vui lòng đăng nhập"));
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
    }
}

