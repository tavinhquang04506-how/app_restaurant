import '../Models/ChatModels.dart';
import '../Repository/ChatRepository.dart';

class ChatService {
  late ChatRepository chatRepository;

  ChatService() {
    chatRepository = ChatRepository();
  }

  Future<ChatConversationResponseWrapper> getMyConversation() async {
    return await chatRepository.getMyConversation();
  }

  Future<ChatMessageResponseWrapper> sendChatMessage({
    String? conversationId,
    String? targetUserId,
    required String content,
  }) async {
    return await chatRepository.sendChatMessage(
      conversationId: conversationId,
      targetUserId: targetUserId,
      content: content,
    );
  }
}
