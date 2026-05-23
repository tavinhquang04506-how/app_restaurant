import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../Utils/AppSession.dart';
import '../Utils/Utils.dart';
import 'BaseRepository.dart';

/// HTTP wrapper chung cho các Repository.
class HttpRepository extends BaseRepository {
  static const Duration _timeout = Duration(seconds: 15);

  Map<String, String> _buildHeaders({Map<String, String>? extra}) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      ...?extra,
    };
    final token = AppSession.accessToken;
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Uri _buildUri(String path, [Map<String, dynamic>? query]) {
    final base = Utils.apiUrl;
    final raw = base.endsWith('/') ? base.substring(0, base.length - 1) : base;
    final p = path.startsWith('/') ? path : '/$path';
    final uri = Uri.parse('$raw$p');
    if (query == null || query.isEmpty) return uri;

    final qp = <String, String>{};
    query.forEach((key, value) {
      if (value == null) return;
      final s = value.toString();
      if (s.isEmpty) return;
      qp[key] = s;
    });
    return uri.replace(queryParameters: qp);
  }

  Future<Map<String, dynamic>> getJson(
    String path, {
    Map<String, dynamic>? query,
    Map<String, String>? headers,
  }) async {
    final response = await _safeRequest(
      () => http.get(
        _buildUri(path, query),
        headers: _buildHeaders(extra: headers),
      ),
    );
    return _decodeAsMap(response);
  }

  Future<Map<String, dynamic>> postJson(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    Map<String, String>? headers,
  }) async {
    final response = await _safeRequest(
      () => http.post(
        _buildUri(path, query),
        headers: _buildHeaders(extra: headers),
        body: body == null ? null : jsonEncode(body),
      ),
    );
    return _decodeAsMap(response);
  }

  Future<Map<String, dynamic>> putJson(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    Map<String, String>? headers,
  }) async {
    final response = await _safeRequest(
      () => http.put(
        _buildUri(path, query),
        headers: _buildHeaders(extra: headers),
        body: body == null ? null : jsonEncode(body),
      ),
    );
    return _decodeAsMap(response);
  }

  Future<Map<String, dynamic>> deleteJson(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    Map<String, String>? headers,
  }) async {
    final response = await _safeRequest(
      () => http.delete(
        _buildUri(path, query),
        headers: _buildHeaders(extra: headers),
        body: body == null ? null : jsonEncode(body),
      ),
    );
    return _decodeAsMap(response);
  }

  Future<http.Response> _safeRequest(
    Future<http.Response> Function() requestFn,
  ) async {
    try {
      return await requestFn().timeout(_timeout);
    } on TimeoutException {
      throw Exception('Kết nối hết thời gian chờ, vui lòng thử lại.');
    } on SocketException {
      throw Exception('Không thể kết nối tới máy chủ, vui lòng kiểm tra mạng.');
    } on http.ClientException catch (e) {
      throw Exception('Lỗi mạng: ${e.message}');
    }
  }

  Map<String, dynamic> _decodeAsMap(http.Response response) {
    // Sign out + throw nếu 401.
    super.handleStatus(response.statusCode);

    String _extractMessage(Map<String, dynamic>? payload) {
      if (payload == null) return '';
      final message = payload['message'];
      final error = payload['error'];

      String stringify(dynamic value) {
        if (value is String) return value;
        if (value is List) {
          return value.map(stringify).where((e) => e.isNotEmpty).join(' ; ');
        }
        if (value is Map) {
          return value.values.map(stringify).where((e) => e.isNotEmpty).join(' ; ');
        }
        return value?.toString() ?? '';
      }

      final msg = stringify(message);
      if (msg.isNotEmpty) return msg;
      final err = stringify(error);
      if (err.isNotEmpty) return err;
      return '';
    }

    Map<String, dynamic>? decoded;
    if (response.body.isNotEmpty) {
      try {
        final payload = jsonDecode(response.body);
        if (payload is Map<String, dynamic>) {
          decoded = payload;
        } else {
          decoded = <String, dynamic>{
            'statusCode': response.statusCode,
            'message': '',
            'data': payload,
          };
        }
      } catch (_) {
        throw Exception('Phản hồi không hợp lệ từ máy chủ.');
      }
    }

    // Kiểm tra HTTP code không thành công.
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final msg = _extractMessage(decoded);
      throw Exception(
        msg.isNotEmpty ? msg : 'Yêu cầu thất bại (HTTP ${response.statusCode}).',
      );
    }

    // Một số API gói statusCode trong payload, kiểm tra thêm.
    final innerStatus = (decoded?['statusCode'] as num?)?.toInt();
    if (innerStatus != null && (innerStatus < 200 || innerStatus >= 300)) {
      final msg = _extractMessage(decoded);
      throw Exception(
        msg.isNotEmpty ? msg : 'Yêu cầu thất bại (mã $innerStatus).',
      );
    }

    if (decoded != null) {
      return decoded!;
    }

    // No-content responses.
    return <String, dynamic>{
      'statusCode': response.statusCode,
      'message': '',
      'data': null,
    };
  }
}
