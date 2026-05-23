package com.fwb.restaurant.specification;

import java.lang.annotation.*;


@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface FilterField {
    String column() default "";
    FilterOperator operator() default FilterOperator.EQUAL;
}
