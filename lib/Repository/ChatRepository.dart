import '../Models/ChatModels.dart';
import '../Utils/Utils.dart';
import 'HttpRepository.dart';

class ChatRepository extends HttpRepository {
  Future<ChatConversationResponseWrapper> getMyConversation() async {
    final json = await getJson(Utils.myConversationApi);
    final res = ChatConversationResponseWrapper.fromJson(json);
    if (!res.status) throw Exception(res.message);
    return res;
  }

  Future<ChatMessageResponseWrapper> sendChatMessage({
    String? conversationId,
    String? targetUserId,
    required String content,
  }) async {
    final json = await postJson(
      Utils.chatSendMessageApi,
      body: {
        if (conversationId != null) 'conversationId': conversationId,
        if (targetUserId != null) 'targetUserId': targetUserId,
        'content': content,
      },
    );
    final res = ChatMessageResponseWrapper.fromJson(json);
    if (!res.status) throw Exception(res.message);
    return res;
  }
}
