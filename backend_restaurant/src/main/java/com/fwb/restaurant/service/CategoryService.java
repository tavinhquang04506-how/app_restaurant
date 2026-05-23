package com.fwb.restaurant.service;

import com.fwb.restaurant.dto.req.category.CategoryRequest;
import com.fwb.restaurant.dto.res.CategoryResponse;
import com.fwb.restaurant.entity.Category;
import com.fwb.restaurant.mapper.CategoryMapper;
import com.fwb.restaurant.repository.CategoryRepository;
import com.fwb.restaurant.utils.error.ConflictException;
import com.fwb.restaurant.utils.error.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryMapper categoryMapper;
    private final CategoryRepository categoryRepository;

    public CategoryResponse create(CategoryRequest request) {
        if (this.categoryRepository.existsByName(request.getName())) {
            throw new ConflictException("Category : " + request.getName() + " đã tồn tại");
        }
        Category category = this.categoryMapper.toCategory(request);

        return this.categoryMapper.toCategoryResponse(this.categoryRepository.save(category));
    }

    public CategoryResponse findById(String id) {
        Category category = this.categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Id : " + id + " không tồn tại"));
        return this.categoryMapper.toCategoryResponse(category);
    }

    public List<CategoryResponse> findAll() {
        List<Category> categories = this.categoryRepository.findAll();

        return categories.stream().map(categoryMapper::toCategoryResponse).toList();
    }

    public CategoryResponse update(String id, CategoryRequest request) {
        Category categoryDB = this.categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category : " + id + " không tồn tại..."));

        if(this.categoryRepository.existsByNameAndIdNot(request.getName(), id)) {
            throw new ConflictException( request.getName() + " đã tồn tại...");
        }

        categoryDB.setName(request.getName());
        categoryDB.setDescription(request.getDescription());
        this.categoryRepository.save(categoryDB);

        return categoryMapper.toCategoryResponse(categoryDB);
    }

    public void delete(String id) {
        this.categoryRepository.deleteById(id);
    }
}
