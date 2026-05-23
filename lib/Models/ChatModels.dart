import 'BaseResponse.dart';

// ==================== ChatMessageModel ====================
class ChatMessageModel {
  ChatMessageModel({
    required this.id,
    required this.conversationId,
    required this.senderType,
    this.senderName,
    this.senderId,
    required this.content,
    required this.createdAt,
  });

  final String id;
  final String conversationId;
  final String senderType;
  final String? senderName;
  final String? senderId;
  final String content;
  final DateTime createdAt;

  bool get isAdmin => senderType == 'ADMIN';

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    return ChatMessageModel(
      id: json['id'] as String,
      conversationId: json['conversationId'] as String,
      senderType: json['senderType'] as String,
      senderName: json['senderName'] as String?,
      senderId: json['senderId'] as String?,
      content: json['content'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

// ==================== ChatConversationModel ====================
class ChatConversationModel {
  ChatConversationModel({
    required this.id,
    required this.userId,
    required this.username,
    this.userEmail,
    this.avatar,
    this.lastMessageAt,
    this.lastMessagePreview,
    this.messages,
  });

  final String id;
  final String userId;
  final String username;
  final String? userEmail;
  final String? avatar;
  final DateTime? lastMessageAt;
  final String? lastMessagePreview;
  final List<ChatMessageModel>? messages;

  factory ChatConversationModel.fromJson(Map<String, dynamic> json) {
    final messages = json['messages'] as List<dynamic>?;
    return ChatConversationModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      username: json['username'] as String,
      userEmail: json['userEmail'] as String?,
      avatar: json['avatar'] as String?,
      lastMessageAt: json['lastMessageAt'] != null
          ? DateTime.parse(json['lastMessageAt'])
          : null,
      lastMessagePreview: json['lastMessagePreview'] as String?,
      messages: messages
          ?.map((e) => ChatMessageModel.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

// ==================== ChatConversationResponseWrapper ====================
class ChatConversationResponseWrapper extends BaseResponse {
  ChatConversationModel? data;

  ChatConversationResponseWrapper({
    required int statusCode,
    required String message,
    this.data,
  }) : super(statusCode: statusCode, message: message);

  factory ChatConversationResponseWrapper.fromJson(Map<String, dynamic> json) {
    final payload = json['data'];
    return ChatConversationResponseWrapper(
      statusCode: (json['statusCode'] as num).toInt(),
      message: json['message'] as String,
      data: payload is Map<String, dynamic>
          ? ChatConversationModel.fromJson(payload)
          : null,
    );
  }
}

// ==================== ChatMessageResponseWrapper ====================
class ChatMessageResponseWrapper extends BaseResponse {
  ChatMessageModel? data;

  ChatMessageResponseWrapper({
    required int statusCode,
    required String message,
    this.data,
  }) : super(statusCode: statusCode, message: message);

  factory ChatMessageResponseWrapper.fromJson(Map<String, dynamic> json) {
    final payload = json['data'];
    return ChatMessageResponseWrapper(
      statusCode: (json['statusCode'] as num).toInt(),
      message: json['message'] as String,
      data:
          payload is Map<String, dynamic> ? ChatMessageModel.fromJson(payload) : null,
    );
  }
}

