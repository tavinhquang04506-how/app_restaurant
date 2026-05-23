package com.fwb.restaurant.specification;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.*;

public class SpecificationBuilder {
    public static <T> Specification<T> build(Object filterDTO) {

        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();

            for (Field field : filterDTO.getClass().getDeclaredFields()) {
                field.setAccessible(true);

                try {
                    Object value = field.get(filterDTO);
                    if (value == null) continue;
                    if (value instanceof String && ((String) value).isEmpty()) continue;

                    FilterField annotation = field.getAnnotation(FilterField.class);
                    if (annotation == null) continue;

                    String column = annotation.column().isEmpty()
                            ? field.getName()
                            : annotation.column();

                    Path<?> path = getPath(root, column);

                    switch (annotation.operator()) {

                        case LIKE -> {
                            predicates.add(
                                    builder.like(
                                            builder.lower(path.as(String.class)),
                                            "%" + value.toString().toLowerCase() + "%"
                                    )
                            );
                        }

                        case EQUAL -> predicates.add(builder.equal(path, value));

                        case GREATER_THAN -> {
                            if (value instanceof Number number) {
                                predicates.add(
                                    builder.greaterThanOrEqualTo(
                                        path.as(Long.class),
                                        number.longValue()
                                    )
                                );
                            }
                        }

                        case LESS_THAN -> {
                            if (value instanceof Number number) {
                                predicates.add(
                                    builder.lessThanOrEqualTo(
                                        path.as(Long.class),
                                        number.longValue()
                                    )
                                );
                            }
                        }
                    }

                } catch (Exception ignored) {}
            }

            return builder.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static <T> Path<?> getPath(Root<T> root, String column) {
        if (!column.contains(".")) {
            return root.get(column);
        }

        String[] parts = column.split("\\.");
        Path<?> path = root;

        for (int i = 0; i < parts.length - 1; i++) {
            String part = parts[i];
            if (path instanceof From<?, ?> from) {
                path = from.join(part, JoinType.LEFT);
            } else {
                path = path.get(part);
            }
        }

        return path.get(parts[parts.length - 1]);
    }
}
