import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { restaurantApi } from '../../services/restaurantApi';
import type { ChatConversation, ChatMessage } from '../../types/types';
import { API_BASE_URL } from '../../services/apiClient';

const formatTime = (value?: string) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
};

const formatShort = (value?: string) => {
  if (!value) return '';
  return value.length > 60 ? `${value.slice(0, 57)}...` : value;
};

const STATUS_CONFIG: Record<string, { label: string; color: 'blue' | 'green' | 'gray' | 'red' }> = {
  WAITING: { label: 'Đang chờ hỗ trợ', color: 'blue' },
  CONNECTED: { label: 'Đang kết nối', color: 'green' },
  CLOSED: { label: 'Đã kết thúc', color: 'gray' },
};

const ChatPage: React.FC = () => {
  const { showToast } = useToast();
  const { user, accessToken } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const conversationSubscription = useRef<StompSubscription | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isAdmin = useMemo(
    () => user?.role === 'ADMIN',
    [user?.role]
  );

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      let data = await restaurantApi.getChatConversations();

      // Nhân viên bất kỳ chi nhánh nào đều có thể hỗ trợ khách hàng
      // Không lọc theo chi nhánh nữa

      setConversations(data);
      if (!selectedConversationId && data.length > 0) {
        setSelectedConversationId(data[0].id);
      } else if (data.length === 0) {
        setSelectedConversationId(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải hội thoại';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedConversationId, showToast, user]);

  const loadMessages = useCallback(
    async (conversationId: string) => {
      try {
        const data = await restaurantApi.getChatMessages(conversationId);
        setMessages(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Không thể tải tin nhắn';
        showToast(message, 'error');
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (!isAdmin) return;
    loadConversations();
  }, [isAdmin, loadConversations]);

  useEffect(() => {
    if (!selectedConversationId) return;
    loadMessages(selectedConversationId);
  }, [loadMessages, selectedConversationId]);

  useEffect(() => {
    if (!isAdmin || !accessToken) return;
    const wsUrl = `${API_BASE_URL.replace(/^http/, 'ws')}/ws-chat`;
    const client = new Client({
      debug: () => undefined,
      reconnectDelay: 5000,
      webSocketFactory: () => new WebSocket(wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    client.onConnect = () => {
      client.subscribe('/topic/chat/conversations', (message: IMessage) => {
        const conversation = JSON.parse(message.body) as ChatConversation;
        setConversations((prev) => {
          // Don't show CLOSED conversations
          if (conversation.status === 'CLOSED') {
            return prev.filter((c) => c.id !== conversation.id);
          }
          const existing = prev.find((c) => c.id === conversation.id);
          if (existing) {
            return prev.map((c) => (c.id === conversation.id ? { ...c, ...conversation } : c));
          }
          return [conversation, ...prev];
        });
      });
      if (selectedConversationId) {
        subscribeConversation(client, selectedConversationId);
      }
    };

    client.activate();
    clientRef.current = client;

    return () => {
      conversationSubscription.current?.unsubscribe();
      client.deactivate();
      clientRef.current = null;
    };
  }, [accessToken, isAdmin, selectedConversationId]);

  const subscribeConversation = (client: Client, conversationId: string) => {
    conversationSubscription.current?.unsubscribe();
    conversationSubscription.current = client.subscribe(
      `/topic/chat/conversation/${conversationId}`,
      (message: IMessage) => {
        const payload = JSON.parse(message.body) as ChatMessage;
        setMessages((prev) => {
          if (prev.find((item) => item.id === payload.id)) {
            return prev;
          }
          return [...prev, payload];
        });
      }
    );
  };

  useEffect(() => {
    if (!clientRef.current || !clientRef.current.connected || !selectedConversationId) return;
    subscribeConversation(clientRef.current, selectedConversationId);
  }, [selectedConversationId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const selectedConversation = conversations.find((item) => item.id === selectedConversationId) || null;
  const isConnected = selectedConversation?.status === 'CONNECTED';
  const isWaiting = selectedConversation?.status === 'WAITING';

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    loadMessages(conversationId);
  };

  /* ─── Staff connects to a waiting conversation ─── */
  const handleConnect = async () => {
    if (!selectedConversationId) return;
    setConnecting(true);
    try {
      await restaurantApi.connectConversation(selectedConversationId);
      showToast('Đã kết nối với khách hàng', 'success');
      // Update local state
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversationId
            ? { ...c, status: 'CONNECTED' as const, assignedStaffId: user?.id, assignedStaffName: user?.username }
            : c
        )
      );
      await loadMessages(selectedConversationId);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi kết nối', 'error');
    } finally {
      setConnecting(false);
    }
  };

  /* ─── Staff closes/ends a conversation ─── */
  const handleClose = async () => {
    if (!selectedConversationId) return;
    if (!confirm('Bạn có chắc muốn kết thúc cuộc hỗ trợ này?')) return;
    try {
      await restaurantApi.closeConversation(selectedConversationId);
      showToast('Đã kết thúc cuộc hỗ trợ', 'success');
      // Remove from list
      setConversations((prev) => prev.filter((c) => c.id !== selectedConversationId));
      setSelectedConversationId(null);
      setMessages([]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi kết thúc', 'error');
    }
  };

  const handleSend = async () => {
    if (!selectedConversationId || !inputValue.trim()) return;
    if (!isConnected) {
      showToast('Vui lòng bấm "Kết nối" trước khi gửi tin nhắn', 'error');
      return;
    }
    const payload = {
      conversationId: selectedConversationId,
      content: inputValue.trim(),
    };
    setSending(true);
    try {
      if (clientRef.current && clientRef.current.connected) {
        clientRef.current.publish({
          destination: '/app/chat/send',
          body: JSON.stringify(payload),
        });
      } else {
        const sent = await restaurantApi.sendChatMessage(payload);
        setMessages((prev) => {
          if (prev.find((item) => item.id === sent.id)) {
            return prev;
          }
          return [...prev, sent];
        });
      }
      setInputValue('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể gửi tin nhắn';
      showToast(message, 'error');
    } finally {
      setSending(false);
    }
  };

  if (!isAdmin) {
    return (
      <PageContainer title="Chat" description="Chức năng chỉ dành cho quản trị viên (Admin)">
        <Card>
          <p className="text-gray-500 text-sm">Bạn không có quyền truy cập trang chat.</p>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Hỗ trợ khách hàng" description="Kết nối và hỗ trợ khách hàng đang cần giúp đỡ">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ─── Conversation List ─── */}
        <Card className="lg:col-span-1 p-0">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Khách hàng cần hỗ trợ</h3>
            <p className="text-xs text-gray-500 mt-1">Chỉ hiển thị khi khách chọn "Gặp tổng đài viên"</p>
          </div>
          {loading ? (
            <p className="text-center text-gray-500 py-6">Đang tải...</p>
          ) : conversations.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-gray-500 text-sm">Hiện tại không có khách hàng nào cần hỗ trợ.</p>
              <p className="text-gray-400 text-xs mt-1">Khách hàng sẽ xuất hiện ở đây khi họ chọn "Gặp tổng đài viên" trên ứng dụng.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {conversations.map((conversation) => {
                const statusCfg = STATUS_CONFIG[conversation.status ?? 'WAITING'];
                return (
                  <li
                    key={conversation.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversationId === conversation.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                    }`}
                    onClick={() => handleSelectConversation(conversation.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-800">{conversation.username}</p>
                      <Badge color={statusCfg?.color ?? 'gray'} size="sm">
                        {statusCfg?.label ?? conversation.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">{formatTime(conversation.lastMessageAt)}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatShort(conversation.lastMessagePreview) || 'Đang chờ kết nối...'}
                    </p>
                    {conversation.assignedStaffName && (
                      <p className="text-xs text-indigo-500 mt-1">👤 {conversation.assignedStaffName}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* ─── Chat Area ─── */}
        <Card className="lg:col-span-2 flex flex-col min-h-[500px]">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="border-b pb-3 mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{selectedConversation.username}</h3>
                  <p className="text-sm text-gray-500">
                    {isWaiting && '⏳ Khách hàng đang chờ bạn kết nối...'}
                    {isConnected && `✅ Đang hỗ trợ bởi ${selectedConversation.assignedStaffName || user?.username}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  {isWaiting && (
                    <Button
                      size="sm"
                      onClick={handleConnect}
                      disabled={connecting}
                      style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none' }}
                    >
                      {connecting ? '⏳ Đang kết nối...' : '🔗 Kết nối'}
                    </Button>
                  )}
                  {isConnected && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleClose}
                    >
                      ✕ Kết thúc
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-[500px]">
                {isWaiting && messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-10">
                    <div className="text-5xl mb-3">🤝</div>
                    <p className="text-sm">Nhấn "Kết nối" để bắt đầu hỗ trợ khách hàng</p>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm">Chưa có tin nhắn nào.</p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderType === 'ADMIN' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-2 max-w-[80%] ${
                          message.senderType === 'ADMIN'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {message.senderType !== 'ADMIN' && (
                          <p className="text-xs font-semibold opacity-70 mb-0.5">{message.senderName || 'Khách hàng'}</p>
                        )}
                        <p className="text-sm">{message.content}</p>
                        <p className="text-[11px] opacity-70 mt-1 text-right">
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area — only available when connected */}
              {isConnected ? (
                <div className="mt-4 flex items-center space-x-3">
                  <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Nhập nội dung tin nhắn..."
                    className="flex-1 rounded-xl border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button variant="primary" onClick={handleSend} disabled={!inputValue.trim()} loading={sending}>
                    Gửi
                  </Button>
                </div>
              ) : isWaiting ? (
                <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-center text-sm text-amber-700">
                  ⚠️ Vui lòng bấm "Kết nối" trước khi có thể gửi tin nhắn hỗ trợ.
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <div className="text-5xl mb-4">💬</div>
              <p className="text-lg font-medium">Chọn một cuộc trò chuyện</p>
              <p className="text-sm mt-1">Chọn khách hàng từ danh sách bên trái để bắt đầu hỗ trợ</p>
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  );
};

export default ChatPage;
