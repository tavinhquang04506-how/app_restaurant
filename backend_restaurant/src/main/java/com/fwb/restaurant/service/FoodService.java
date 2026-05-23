package com.fwb.restaurant.service;

import com.fwb.restaurant.dto.req.food.FoodRequest;
import com.fwb.restaurant.dto.req.food.FoodSpecRequest;
import com.fwb.restaurant.dto.res.FoodResponse;
import com.fwb.restaurant.dto.res.PaginationResponse;
import com.fwb.restaurant.entity.Category;
import com.fwb.restaurant.entity.Food;
import com.fwb.restaurant.mapper.FoodMapper;
import com.fwb.restaurant.repository.CategoryRepository;
import com.fwb.restaurant.repository.FoodRepository;
import com.fwb.restaurant.dto.res.FoodRatingResponse;
import com.fwb.restaurant.repository.FoodRatingRepository;
import com.fwb.restaurant.specification.GenericSpecification;
import com.fwb.restaurant.utils.error.ConflictException;
import com.fwb.restaurant.utils.error.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FoodService {
    private final FoodMapper foodMapper;
    private final FoodRepository foodRepository;
    private final CategoryRepository categoryRepository;
    private final FoodRatingRepository foodRatingRepository;

    public List<FoodRatingResponse> getRatings(String foodId) {
        if (!foodRepository.existsById(foodId)) {
            throw new ResourceNotFoundException("Món ăn không tồn tại");
        }
        return foodRatingRepository.findByFoodIdOrderByCreatedAtDesc(foodId).stream()
                .map(rating -> FoodRatingResponse.builder()
                        .id(rating.getId())
                        .username(rating.getUser().getUsername())
                        .comment(rating.getComment())
                        .rating(rating.getRating())
                        .createdAt(rating.getCreatedAt() != null ? rating.getCreatedAt().toString() : "")
                        .build())
                .toList();
    }

    public FoodResponse create(FoodRequest request) {
        if (this.foodRepository.existsByName(request.getName())) {
            throw new ConflictException("Món : " + request.getName() + " đã tồn tại");
        }

        Category category = this.categoryRepository.findById(request.getCategoryId())
                .orElseThrow(()  -> new ResourceNotFoundException("Loại này không tồn tại"));

        Food food = this.foodMapper.toFood(request);
        food.setCategory(category);

        return this.foodMapper.toFoodResponse(foodRepository.save(food));
    }

    public FoodResponse findById(String id) {
        Food food = this.foodRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Id : " + id + " không tồn tại"));
        return this.foodMapper.toFoodResponse(food);
    }

    public PaginationResponse findAll(FoodSpecRequest foodSpecRequest, Pageable pageable) {
        Specification<Food> spec = GenericSpecification.filter(foodSpecRequest);
        Page<Food> page = this.foodRepository.findAll(spec, pageable);

        PaginationResponse.Meta meta = PaginationResponse.Meta.builder()
                .page(page.getNumber() + 1)
                .pages(page.getTotalPages())
                .pageSize(page.getSize())
                .total(page.getTotalElements())
                .build();

        List<FoodResponse> result = page.getContent().stream().map(foodMapper::toFoodResponse).toList();

        return PaginationResponse.builder()
                .meta(meta)
                .result(result)
                .build();
    }

    public FoodResponse update(String id, FoodRequest request) {
        Food foodDB = this.foodRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Id : " + id + " không tồn tại"));

        Category category = this.categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tồn tại loại này"));

        if(this.foodRepository.existsByNameAndIdNot(request.getName(), id)) {
            throw new ConflictException("Tên món : " + request.getName() + " đã tồn tại");
        }

        foodDB.setCategory(category);
        this.foodMapper.updateFood(request, foodDB);
        return this.foodMapper.toFoodResponse(foodRepository.save(foodDB));
    }

    public void delete(String id) {
        if(!this.foodRepository.existsById(id)) {
            throw new ResourceNotFoundException("Id : " + id + " không tồn tại");
        }

        this.foodRepository.deleteById(id);
    }
}
