package com.fwb.restaurant.utils.validation;

import com.fwb.restaurant.dto.req.auth.RegisterRequest;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PasswordValidator implements ConstraintValidator<PasswordValid, RegisterRequest> {
    @Override
    public boolean isValid(RegisterRequest value, ConstraintValidatorContext context) {
        if (value == null) return true;

        if (!value.getPassword().equals(value.getConfirmPassword())) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("Mật khẩu không trùng khớp...")
                    .addPropertyNode("confirmPassword")
                    .addConstraintViolation();
            return false;
        }

        return true;
    }
}
