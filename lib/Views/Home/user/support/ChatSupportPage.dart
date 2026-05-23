import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:stomp_dart_client/stomp_dart_client.dart';

import 'package:android/Utils/ApiConfig.dart';
import 'package:android/Models/backend_models.dart';
import 'package:android/Utils/AppSession.dart';
import 'package:android/Service/ChatService.dart';


class ChatHoTroPage extends StatefulWidget {
  const ChatHoTroPage({super.key});

  @override
  State<ChatHoTroPage> createState() => _ChatHoTroPageState();
}

class _ChatHoTroPageState extends State<ChatHoTroPage> with WidgetsBindingObserver {
  final ChatService _chatService = ChatService();
  final TextEditingController _messageController = TextEditingController();
  final List<ChatMessageModel> _messages = [];
  final ScrollController _scrollController = ScrollController();

  ChatConversationModel? _conversation;
  StompClient? _stompClient;
  bool _loading = false;
  bool _connecting = false;

  String get _socketEndpoint {
    final base = buildApiBasePath();
    return '$base/ws-chat';
  }
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    if (AppSession.isLoggedIn) {
      _initializeChat();
    }
  }

  Future<void> _initializeChat() async {
    await _loadConversation();
    _connectSocket();
  }

  Future<void> _loadConversation() async {
    setState(() {
      _loading = true;
    });
    try {
      final res = await _chatService.getMyConversation();
      final conversation = res.data;
      if (conversation == null) throw Exception('Không thể tải lịch sử chat');
      setState(() {
        _conversation = conversation;
        _messages
          ..clear()
          ..addAll(conversation.messages ?? []);
      });
    } catch (err) {
      debugPrint('Chat load error: $err');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không thể tải lịch sử chat')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  void _connectSocket() {
    final token = AppSession.accessToken;
    if (token == null) return;

    setState(() {
      _connecting = true;
    });
    debugPrint('ChatSocket: Connecting to $_socketEndpoint (for chat only)');

    _stompClient = StompClient(
      config: StompConfig.sockJS(
        url: _socketEndpoint,
        stompConnectHeaders: {'Authorization': 'Bearer $token'},
        webSocketConnectHeaders: {'Authorization': 'Bearer $token'},
        onConnect: _onSocketConnected,
        onWebSocketError: (dynamic error) {
          debugPrint('WebSocket error: $error');
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Không thể kết nối chat realtime')),
          );
          setState(() => _connecting = false);
        },
        onDisconnect: (_) {
          debugPrint('ChatSocket: Disconnected');
          setState(() => _connecting = false);
        },
      ),
    );
    _stompClient?.activate();
  }

  void _onSocketConnected(StompFrame frame) {
    debugPrint('ChatSocket: Connected');
    setState(() => _connecting = false);
    _stompClient?.subscribe(
      destination: '/user/queue/chat',
      callback: (frame) {
        if (!mounted || frame.body == null) return;
        final payload =
            ChatMessageModel.fromJson(jsonDecode(frame.body!) as Map<String, dynamic>);
        _appendMessage(payload);
      },
    );
    if (_conversation != null) {
      _stompClient?.subscribe(
        destination: '/topic/chat/conversation/${_conversation!.id}',
        callback: (frame) {
          if (!mounted || frame.body == null) return;
          final payload =
              ChatMessageModel.fromJson(jsonDecode(frame.body!) as Map<String, dynamic>);
          _appendMessage(payload);
        },
      );
    }
  }

  void _appendMessage(ChatMessageModel message) {
    if (_conversation == null || message.conversationId != _conversation!.id) return;
    setState(() {
      if (_messages.indexWhere((m) => m.id == message.id) == -1) {
        _messages.add(message);
      }
    });
    _scrollToBottom();
  }

  Future<void> _sendMessage() async {
    if (_conversation == null) return;
    final content = _messageController.text.trim();
    if (content.isEmpty) return;

    try {
      if (_stompClient != null && _stompClient!.connected) {
        final payload = jsonEncode({
          'conversationId': _conversation!.id,
          'content': content,
        });
        _stompClient!.send(destination: '/app/chat/send', body: payload);
      } else {
        final res = await _chatService.sendChatMessage(
          conversationId: _conversation!.id,
          content: content,
        );
        final sent = res.data;
        if (sent != null) {
          _appendMessage(sent);
        }
      }
      _messageController.clear();
    } catch (err) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không thể gửi tin nhắn')),
      );
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _messageController.dispose();
    _scrollController.dispose();
    if (_stompClient != null) {
      debugPrint('ChatSocket: Disposing, deactivating socket');
    }
    _stompClient?.deactivate();
    _stompClient = null;
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.detached) {
      debugPrint('ChatSocket: App detached, deactivating socket');
      _stompClient?.deactivate();
      _stompClient = null;
    }
  }

  Widget _buildMessage(ChatMessageModel message) {
    final isUser = message.senderType == 'USER';
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isUser ? Colors.redAccent : Colors.grey.shade300,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment:
              isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Text(
              message.content,
              style: TextStyle(color: isUser ? Colors.white : Colors.black87),
            ),
            const SizedBox(height: 4),
            Text(
              _formatTime(message.createdAt),
              style: TextStyle(
                fontSize: 10,
                color: isUser ? Colors.white70 : Colors.black45,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime time) {
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  }

  Widget _buildBody() {
    if (!AppSession.isLoggedIn) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Bạn cần đăng nhập để sử dụng chat hỗ trợ.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white, fontSize: 16),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => Navigator.pushNamed(context, '/login'),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                child: const Text('Đăng nhập ngay'),
              ),
            ],
          ),
        ),
      );
    }

    if (_loading) {
      return const Center(
        child: CircularProgressIndicator(color: Colors.white),
      );
    }

    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.all(16),
            itemCount: _messages.length,
            itemBuilder: (context, index) => _buildMessage(_messages[index]),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          color: const Color(0xFF1F1B1B),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _messageController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    hintText: 'Nhập tin nhắn...',
                    hintStyle: TextStyle(color: Colors.white54),
                    border: InputBorder.none,
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.send, color: Colors.redAccent),
                onPressed: _sendMessage,
              ),
            ],
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF2A0E0E),
      appBar: AppBar(
        title: const Text('Chat hỗ trợ'),
        backgroundColor: const Color(0xFF2A0E0E),
        foregroundColor: Colors.white,
        actions: [
          if (_connecting)
            const Padding(
              padding: EdgeInsets.only(right: 16),
              child: Center(
                child: SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                ),
              ),
            ),
        ],
      ),
      body: _buildBody(),
    );
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    });
  }
}
