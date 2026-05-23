import 'package:intl/intl.dart';

final NumberFormat _vndFormatter = NumberFormat.decimalPattern('vi_VN');

/// Format tiền VND theo kiểu: `1.234.567đ` (không có khoảng trắng trước "đ").
String formatVnd(int value) => '${_vndFormatter.format(value)}đ';


