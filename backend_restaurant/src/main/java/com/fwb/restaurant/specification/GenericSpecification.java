package com.fwb.restaurant.specification;

import org.springframework.data.jpa.domain.Specification;

public class GenericSpecification {
    public static <T> Specification<T> filter(Object dto) {
        return SpecificationBuilder.build(dto);
    }
}
