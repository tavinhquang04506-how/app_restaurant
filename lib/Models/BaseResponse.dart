class BaseResponse {
  late int statusCode;
  late String message;
  late bool status;

  BaseResponse({
    required int statusCode,
    required String message,
  }) {
    this.statusCode = statusCode;
    this.message = message;
    status = statusCode >= 200 && statusCode < 300;
  }

  @override
  String toString() {
    return 'BaseResponse{status: $status, statusCode: $statusCode, message: $message}';
  }
}


