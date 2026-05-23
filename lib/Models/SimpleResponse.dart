import 'BaseResponse.dart';

class SimpleResponse extends BaseResponse {
  final dynamic data;

  SimpleResponse({
    required int statusCode,
    required String message,
    this.data,
  }) : super(statusCode: statusCode, message: message);

  factory SimpleResponse.fromJson(Map<String, dynamic> json) {
    String _msg(dynamic raw) {
      if (raw is String) return raw;
      if (raw is List) return raw.join(' ; ');
      if (raw is Map) return raw.values.join(' ; ');
      return raw?.toString() ?? '';
    }

    final statusCode = (json['statusCode'] as num).toInt();
    final message = _msg(json['message']);
    return SimpleResponse(
      statusCode: statusCode,
      message: message,
      data: json['data'],
    );
  }
}


