/**
 * Centralized validators for form fields.
 * Synced with backend RegisterRequest.java validation rules:
 * - username: @NotBlank, @Length(min=3)
 * - email: @NotBlank, @Email
 * - phone: @NotBlank, @Pattern("^(0[35789][0-9]{8})$")
 * - password: @NotBlank, @Length(min=8), @Pattern(".*[A-Z].*")
 * - confirmPassword: @NotBlank, must match password
 */
const EMAIL_REGEX = /^[\w\-\.]+@([\w\-]+\.)+[\w\-]{2,4}$/;
const PHONE_REGEX = /^(0[35789][0-9]{8})$/;

export const Validators = {
  email(value?: string, fieldName = 'Email'): string | null {
    if (!value || !value.trim()) return `${fieldName} không được để trống`;
    if (!EMAIL_REGEX.test(value.trim())) return `Vui lòng nhập đúng định dạng email`;
    return null;
  },

  password(
    value?: string,
    options: { minLength?: number; fieldName?: string } = {},
  ): string | null {
    const { minLength = 8, fieldName = 'Mật khẩu' } = options;
    if (!value || !value.trim()) return `${fieldName} không được để trống`;
    const v = value.trim();
    if (v.length < minLength) return `Độ dài mật khẩu ít nhất ${minLength} ký tự`;
    if (!/[A-Z]/.test(v)) return `Mật khẩu phải chứa ít nhất một ký tự in hoa`;
    return null;
  },

  confirmPassword(getPassword: () => string, fieldName = 'Mật khẩu xác nhận') {
    return (value?: string): string | null => {
      if (!value || !value.trim()) return `${fieldName} không được để trống`;
      if (value.trim() !== getPassword().trim()) return 'Mật khẩu nhập lại không khớp';
      return null;
    };
  },

  phone(value?: string, fieldName = 'Số điện thoại'): string | null {
    if (!value || !value.trim()) return `${fieldName} không được để trống`;
    if (!PHONE_REGEX.test(value.trim())) return `Vui lòng nhập đúng định dạng số điện thoại`;
    return null;
  },

  required(value?: string, fieldName = 'Trường này'): string | null {
    if (!value || !value.trim()) return `${fieldName} không được để trống`;
    return null;
  },

  name(value?: string, fieldName = 'Tên'): string | null {
    if (!value || !value.trim()) return `${fieldName} không được để trống`;
    if (value.trim().length < 3) return `Độ dài của tên ít nhất 3 ký tự`;
    return null;
  },

  otp(value?: string, length = 6, fieldName = 'Mã OTP'): string | null {
    if (!value || !value.trim()) return `${fieldName} không được để trống`;
    if (value.trim().length !== length) return `${fieldName} phải ${length} số`;
    return null;
  },
};
