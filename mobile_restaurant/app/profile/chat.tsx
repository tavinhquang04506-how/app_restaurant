import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar,
  ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeStore } from '../../stores/useThemeStore';
import { useLanguageStore } from '../../stores/useLanguageStore';
import * as Api from '../../repositories/ApiRepository';

interface Message {
  id: string;
  sender: 'bot' | 'user' | 'agent' | 'system';
  senderName: string;
  content: string;
  createdAt: number;
}

export default function ChatScreen() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const { colors, isDarkMode } = useThemeStore();
  const { t, language } = useLanguageStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const [isChatEnded, setIsChatEnded] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [endSessionTime, setEndSessionTime] = useState<number | null>(null);
  const [timeLeftStr, setTimeLeftStr] = useState('');
  const [isWaitingForAgent, setIsWaitingForAgent] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  // Constants
  const STORAGE_KEY = `chat_session_${user?.id ?? 'guest'}`;

  // Bot Auto Answers Dictionary
  const botAnswers: Record<string, string> = {
    booking: language === 'vi' 
      ? 'Để đặt bàn, quý khách hãy chuyển đến mục "Đặt bàn", chọn chi nhánh, số khách, ngày & giờ mong muốn, sau đó nhấn "Hoàn tất đặt bàn". Quý khách cũng có thể chọn trước món ăn tại Thực đơn.' 
      : 'To book a table, go to the "Booking" tab, select a branch, guests, date & time, then click "Complete Booking". You can also pre-order dishes from the Menu.',
    cancel: language === 'vi'
      ? 'Quý khách có thể tự do hủy bàn trước giờ đặt ít nhất 2 tiếng thông qua trang "Lịch sử đặt bàn" trong mục Tài khoản để không phát sinh chi phí.'
      : 'You can cancel your reservation for free at least 2 hours before the booking time in "Booking History" under the Account tab.',
    deals: language === 'vi'
      ? 'Nhà hàng đang áp dụng các khuyến mãi hấp dẫn: giảm 20% khi nhập WELCOME20 và giảm 15% khi nhập SUMMER15. Quý khách hãy xem chi tiết và lưu mã tại Trang chủ!'
      : 'We have hot deals: 20% off with WELCOME20 and 15% off with SUMMER15. View and save these promotion codes on the Home page!',
  };

  // Seed messages
  const getInitialMessages = (): Message[] => [
    {
      id: 'welcome',
      sender: 'bot',
      senderName: language === 'vi' ? 'Trợ lý ảo 3Ship' : '3Ship Virtual Assistant',
      content: t('botWelcome'),
      createdAt: Date.now(),
    }
  ];

  // Initialize
  useEffect(() => {
    const loadSession = async () => {
      try {
        if (isLoggedIn) {
          // If logged in, fetch from backend to see if there is an active session
          try {
            const res = await Api.getMyConversation();
            if (res.data) {
              const conv = res.data;
              setConversationId(conv.id);
              const backendMsgs = conv.messages || [];
              
              if (backendMsgs.length > 0) {
                // If we already have backend messages, map them
                const mapped: Message[] = backendMsgs.map((m: any) => ({
                  id: m.id || String(m.createdAt || Date.now()),
                  sender: m.senderType === 'ADMIN' ? 'agent' : 'user',
                  senderName: m.senderName || (m.senderType === 'ADMIN' ? 'Tổng đài viên' : 'Khách hàng'),
                  content: m.content,
                  createdAt: m.createdAt ? new Date(m.createdAt).getTime() : Date.now(),
                }));

                const firstAdmin = backendMsgs.find((m: any) => m.senderType === 'ADMIN');
                if (firstAdmin) {
                  setIsAgentConnected(true);
                  setIsWaitingForAgent(false);
                } else {
                  // User has sent messages but no agent has replied yet
                  setIsWaitingForAgent(true);
                  setIsAgentConnected(false);
                }
                setMessages(mapped);
                setLoading(false);
                return;
              }
            }
          } catch (err) {
            console.log('Error loading backend chat session:', err);
          }
        }

        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          setMessages(parsed.messages || getInitialMessages());
          setIsAgentConnected(parsed.isAgentConnected || false);
          setIsChatEnded(parsed.isChatEnded || false);
          setEndSessionTime(parsed.endSessionTime || null);
        } else {
          setMessages(getInitialMessages());
        }
      } catch {
        setMessages(getInitialMessages());
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, [language, isLoggedIn]);

  // Persist session
  const saveSession = async (
    msgsList: Message[],
    agentState: boolean,
    endedState: boolean,
    endedTime: number | null
  ) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          messages: msgsList,
          isAgentConnected: agentState,
          isChatEnded: endedState,
          endSessionTime: endedTime,
        })
      );
    } catch {}
  };

  // Timer for frozen countdown (10 minutes)
  useEffect(() => {
    if (!isChatEnded || !endSessionTime) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - endSessionTime;
      const totalDuration = 10 * 60 * 1000; // 10 minutes
      const remaining = totalDuration - elapsed;

      if (remaining <= 0) {
        clearInterval(interval);
        handleResetChat();
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setTimeLeftStr(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isChatEnded, endSessionTime]);

  const handleResetChat = async () => {
    const freshMsgs = getInitialMessages();
    setMessages(freshMsgs);
    setIsAgentConnected(false);
    setIsChatEnded(false);
    setEndSessionTime(null);
    setIsWaitingForAgent(false);
    setConversationId(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  // Sync / Polling effect
  useEffect(() => {
    if (!isLoggedIn || isChatEnded) return;
    if (!isAgentConnected && !isWaitingForAgent) return;

    const interval = setInterval(async () => {
      try {
        const res = await Api.getMyConversation();
        if (res.data) {
          const conv = res.data;
          setConversationId(conv.id);
          
          if (conv.status === 'CLOSED') {
            setIsChatEnded(true);
            setIsAgentConnected(false);
            setIsWaitingForAgent(false);
            const endTime = Date.now();
            setEndSessionTime(endTime);

            const sysEndMsg: Message = {
              id: `sys-end-${Date.now()}`,
              sender: 'system',
              senderName: 'SYSTEM',
              content: language === 'vi' 
                ? 'Cuộc trò chuyện đã được kết thúc bởi tổng đài viên.' 
                : 'The conversation was ended by the operator.',
              createdAt: endTime,
            };

            setMessages((prev) => {
              const cleanPrev = prev.filter((m) => !m.id.startsWith('sys-connecting'));
              const updated = [...cleanPrev, sysEndMsg];
              saveSession(updated, false, true, endTime);
              return updated;
            });
            return;
          }

          const backendMsgs = conv.messages || [];

          // Convert backend messages to local
          const mapped: Message[] = backendMsgs.map((m: any) => ({
            id: m.id || String(m.createdAt || Date.now()),
            sender: m.senderType === 'ADMIN' ? 'agent' : 'user',
            senderName: m.senderName || (m.senderType === 'ADMIN' ? 'Tổng đài viên' : 'Khách hàng'),
            content: m.content,
            createdAt: m.createdAt ? new Date(m.createdAt).getTime() : Date.now(),
          }));

          // Check if agent joined
          const firstAdmin = backendMsgs.find((m: any) => m.senderType === 'ADMIN');
          
          if (firstAdmin && !isAgentConnected) {
            // Agent just connected!
            setIsAgentConnected(true);
            setIsWaitingForAgent(false);

            const adminName = firstAdmin.senderName || (language === 'vi' ? 'Tổng đài viên' : 'Operator');
            
            // Add system messages
            const connMsg: Message = {
              id: `sys-conn-${Date.now()}`,
              sender: 'system',
              senderName: 'SYSTEM',
              content: language === 'vi' ? `Tổng đài viên ${adminName} đã kết nối.` : `Operator ${adminName} has connected.`,
              createdAt: Date.now(),
            };

            setMessages((prev) => {
              // We filter out any pending system connecting messages to keep it clean, then add mapped and connMsg
              const cleanPrev = prev.filter((m) => !m.id.startsWith('sys-connecting'));
              const updated = [...cleanPrev, connMsg];
              mapped.forEach((m) => {
                if (!updated.some((p) => p.id === m.id)) {
                  updated.push(m);
                }
              });
              saveSession(updated, true, false, null);
              return updated;
            });
          } else {
            // Just update messages
            setMessages((prev) => {
              const cleanPrev = prev.filter((m) => !m.id.startsWith('sys-connecting') || isWaitingForAgent);
              // Merge mapped messages
              const merged = [...cleanPrev];
              mapped.forEach((m) => {
                if (!merged.some((p) => p.id === m.id)) {
                  merged.push(m);
                }
              });
              saveSession(merged, isAgentConnected, false, null);
              return merged;
            });
          }
        }
      } catch (err) {
        console.log('Error polling chat:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isLoggedIn, isAgentConnected, isWaitingForAgent, isChatEnded, language]);

  const addMessage = (msg: Message) => {
    setMessages((prev) => {
      const updated = [...prev, msg];
      saveSession(updated, isAgentConnected, isChatEnded, endSessionTime);
      return updated;
    });
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // Trigger agent handoff simulation
  const connectAgent = async () => {
    if (isAgentConnected || isChatEnded) return;

    // Show connecting status
    const sysMsg: Message = {
      id: `sys-connecting-${Date.now()}`,
      sender: 'system',
      senderName: 'SYSTEM',
      content: t('connectingAgent'),
      createdAt: Date.now(),
    };
    addMessage(sysMsg);
    setIsWaitingForAgent(true);

    try {
      // Send message to the backend to open support ticket/conversation
      const res = await Api.sendChatMessage({
        content: language === 'vi' ? 'Khách hàng yêu cầu hỗ trợ trực tiếp' : 'Customer requested live agent support',
      });
      if (res.data) {
        setConversationId(res.data.conversationId);
      }
    } catch (err) {
      console.log('Error opening support ticket:', err);
    }
  };

  // Quick replies
  const handleQuickReply = (type: 'booking' | 'cancel' | 'deals' | 'agent') => {
    if (isChatEnded || isAgentConnected) return;

    // Add user message
    let text = '';
    if (type === 'booking') text = t('optionBookingGuide');
    if (type === 'cancel') text = t('optionCancelPolicy');
    if (type === 'deals') text = t('optionCurrentDeals');
    if (type === 'agent') text = t('optionContactAgent');

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      senderName: user?.name ?? 'Khách hàng',
      content: text,
      createdAt: Date.now(),
    };
    addMessage(userMsg);

    if (type === 'agent') {
      connectAgent();
    } else {
      // Simulate Bot response delay
      setAgentTyping(true);
      setTimeout(() => {
        setAgentTyping(false);
        const ans = botAnswers[type];
        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          senderName: language === 'vi' ? 'Trợ lý ảo 3Ship' : '3Ship Virtual Assistant',
          content: ans,
          createdAt: Date.now(),
        };
        addMessage(botMsg);
      }, 800);
    }
  };

  // Handle send message
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isChatEnded) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      senderName: user?.name ?? 'Khách hàng',
      content: text,
      createdAt: Date.now(),
    };
    addMessage(userMsg);
    setInputText('');

    if (isAgentConnected) {
      try {
        await Api.sendChatMessage({
          conversationId: conversationId || undefined,
          content: text,
        });
      } catch (err) {
        console.log('Error sending live message:', err);
      }
    } else {
      // Keyword matching for Bot
      setAgentTyping(true);
      setTimeout(() => {
        setAgentTyping(false);
        const lower = text.toLowerCase();
        let reply = '';
        if (lower.includes('đặt bàn') || lower.includes('chọn bàn') || lower.includes('booking')) {
          reply = botAnswers.booking;
        } else if (lower.includes('hủy') || lower.includes('cancel')) {
          reply = botAnswers.cancel;
        } else if (lower.includes('ưu đãi') || lower.includes('khuyến mãi') || lower.includes('deals') || lower.includes('discount')) {
          reply = botAnswers.deals;
        } else if (lower.includes('tổng đài') || lower.includes('hotline') || lower.includes('nhân viên') || lower.includes('agent')) {
          connectAgent();
          return;
        } else {
          reply = language === 'vi'
            ? 'Xin lỗi, tôi chưa hiểu rõ ý bạn. Bạn có thể chọn các nút chức năng nhanh phía dưới hoặc hỏi trực tiếp về "đặt bàn", "hủy bàn", "ưu đãi" để tôi giải đáp ngay nhé!'
            : 'Sorry, I did not understand. You can tap the quick replies below or ask about "booking", "cancellation", or "deals".';
        }

        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          senderName: language === 'vi' ? 'Trợ lý ảo 3Ship' : '3Ship Virtual Assistant',
          content: reply,
          createdAt: Date.now(),
        };
        addMessage(botMsg);
      }, 800);
    }
  };

  // Simulated operator / user ends chat
  const handleEndChat = () => {
    Alert.alert(
      language === 'vi' ? 'Kết thúc cuộc trò chuyện' : 'End Chat Session',
      language === 'vi' ? 'Bạn có chắc chắn muốn kết thúc đoạn chat hỗ trợ này?' : 'Are you sure you want to end this support session?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: language === 'vi' ? 'Kết thúc' : 'End',
          style: 'destructive',
          onPress: async () => {
            const endedTime = Date.now();
            setIsChatEnded(true);
            setEndSessionTime(endedTime);

            if (conversationId) {
              try {
                await Api.closeMyConversation(conversationId);
              } catch (err) {
                console.log('Error closing conversation on backend:', err);
              }
            }

            const sysEndMsg: Message = {
              id: `sys-end-${Date.now()}`,
              sender: 'system',
              senderName: 'SYSTEM',
              content: t('chatEndedStatus'),
              createdAt: endedTime,
            };
            
            setMessages((prev) => {
              const updated = [...prev, sysEndMsg];
              saveSession(updated, isAgentConnected, true, endedTime);
              return updated;
            });
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
          }
        }
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.sender === 'system') {
      return (
        <View style={styles.systemContainer}>
          <Text style={[styles.systemText, { color: colors.textSecondary }]}>{item.content}</Text>
        </View>
      );
    }

    const isMe = item.sender === 'user';
    const bubbleBg = isMe
      ? colors.primary
      : isDarkMode
      ? colors.card
      : '#FFFFFF';

    return (
      <View style={[styles.messageBubbleContainer, isMe ? styles.myMessageAlign : styles.otherMessageAlign]}>
        {!isMe && (
          <Text style={[styles.senderName, { color: colors.primary }]}>{item.senderName}</Text>
        )}
        <View
          style={[
            styles.messageBubble,
            { backgroundColor: bubbleBg, borderColor: colors.border },
            isMe ? styles.myBubbleShape : styles.otherBubbleShape,
          ]}
        >
          <Text style={[styles.messageText, { color: isMe ? '#FFFFFF' : colors.text }]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, { color: isMe ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>
            {new Date(item.createdAt).toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('liveSupport')}</Text>
        
        {isAgentConnected && !isChatEnded ? (
          <TouchableOpacity onPress={handleEndChat} style={styles.endChatHeaderBtn}>
            <Text style={styles.endChatHeaderBtnText}>{t('endChat')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {!isLoggedIn ? (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            {language === 'vi' ? 'Vui lòng đăng nhập để sử dụng tính năng hỗ trợ trực tuyến.' : 'Please log in to use the live help support feature.'}
          </Text>
          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginBtnText}>{language === 'vi' ? 'Đăng nhập ngay' : 'Log In Now'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              {/* Frozen Lock Banner */}
              {isChatEnded && (
                <View style={[styles.frozenBanner, { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff3f3', borderBottomColor: colors.border }]}>
                  <Ionicons name="lock-closed" size={16} color={colors.primary} />
                  <Text style={[styles.frozenText, { color: colors.text }]}>
                    {timeLeftStr ? `${t('chatEndedStatus')} (${timeLeftStr})` : t('chatEndedStatus')}
                  </Text>
                  <TouchableOpacity
                    style={[styles.resetBtn, { backgroundColor: colors.primary }]}
                    onPress={handleResetChat}
                  >
                    <Text style={styles.resetBtnText}>{t('startNewChat')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messageList}
                ListFooterComponent={() => 
                  agentTyping ? (
                    <View style={styles.typingContainer}>
                      <Text style={[styles.typingText, { color: colors.textSecondary }]}>
                        {isAgentConnected 
                          ? (language === 'vi' ? 'Nguyễn Tuấn Anh đang soạn tin...' : 'Nguyen Tuan Anh is typing...')
                          : (language === 'vi' ? 'Trợ lý ảo đang gõ...' : 'Virtual assistant is typing...')}
                      </Text>
                    </View>
                  ) : null
                }
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              />

              {/* Quick Replies - Hide if agent is connected or chat is ended */}
              {!isAgentConnected && !isChatEnded && messages.length > 0 && (
                <View style={[styles.quickRepliesContainer, { borderTopColor: colors.border }]}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRepliesScroll}>
                    <TouchableOpacity style={[styles.quickBtn, { borderColor: colors.primary }]} onPress={() => handleQuickReply('booking')}>
                      <Text style={[styles.quickBtnText, { color: colors.primary }]}>{t('optionBookingGuide')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.quickBtn, { borderColor: colors.primary }]} onPress={() => handleQuickReply('cancel')}>
                      <Text style={[styles.quickBtnText, { color: colors.primary }]}>{t('optionCancelPolicy')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.quickBtn, { borderColor: colors.primary }]} onPress={() => handleQuickReply('deals')}>
                      <Text style={[styles.quickBtnText, { color: colors.primary }]}>{t('optionCurrentDeals')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.quickBtn, { borderColor: colors.primary, backgroundColor: colors.primary }]} onPress={() => handleQuickReply('agent')}>
                      <Text style={[styles.quickBtnText, { color: '#FFFFFF' }]}>{t('optionContactAgent')}</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              )}

              {/* Footer Input Area */}
              <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDarkMode ? '#2C2C2E' : '#F5F5F5',
                      color: colors.text,
                      borderColor: colors.border,
                    }
                  ]}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder={isChatEnded ? (language === 'vi' ? 'Cuộc chat đã bị đóng...' : 'Chat is locked...') : t('chatPlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  maxLength={500}
                  editable={!isChatEnded}
                />
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    { backgroundColor: colors.primary },
                    (!inputText.trim() || isChatEnded) && styles.sendBtnDisabled
                  ]}
                  onPress={handleSend}
                  disabled={!inputText.trim() || isChatEnded}
                >
                  <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  endChatHeaderBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FF3B30' },
  endChatHeaderBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 16, marginTop: 12, textAlign: 'center', lineHeight: 24 },
  loginBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  loginBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  messageList: { padding: 16, paddingBottom: 24 },
  messageBubbleContainer: { maxWidth: '80%', marginBottom: 12 },
  myMessageAlign: { alignSelf: 'flex-end' },
  otherMessageAlign: { alignSelf: 'flex-start' },
  senderName: { fontSize: 12, fontWeight: 'bold', marginBottom: 4, marginLeft: 4 },
  messageBubble: { padding: 12, borderRadius: 16, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 3, elevation: 1 },
  myBubbleShape: { borderBottomRightRadius: 2 },
  otherBubbleShape: { borderBottomLeftRadius: 2 },
  messageText: { fontSize: 15, lineHeight: 22 },
  messageTime: { fontSize: 10, marginTop: 4, textAlign: 'right' },
  systemContainer: { alignSelf: 'center', marginVertical: 12, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.05)', maxWidth: '90%' },
  systemText: { fontSize: 12, textAlign: 'center', fontStyle: 'italic' },
  typingContainer: { alignSelf: 'flex-start', marginLeft: 8, marginBottom: 12 },
  typingText: { fontSize: 12, fontStyle: 'italic' },
  quickRepliesContainer: { paddingVertical: 10, borderTopWidth: 1 },
  quickRepliesScroll: { paddingHorizontal: 16, gap: 8 },
  quickBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  quickBtnText: { fontSize: 13, fontWeight: '500' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1,
  },
  input: {
    flex: 1, borderRadius: 20, paddingHorizontal: 16, borderWidth: 1,
    paddingVertical: 10, fontSize: 15, maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center', marginLeft: 8,
  },
  sendBtnDisabled: { opacity: 0.4 },
  frozenBanner: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, gap: 8, flexWrap: 'wrap',
  },
  frozenText: { fontSize: 12, flex: 1, fontWeight: '500' },
  resetBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  resetBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
});
