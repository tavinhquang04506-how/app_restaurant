/**
 * Format tiền VND theo kiểu: `1.234.567đ`
 */
export function formatVnd(value: number): string {
  return value.toLocaleString('vi-VN') + 'đ';
}
