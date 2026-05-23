import { parseBaseResponse, type BaseResponse } from './AuthModels';

// ==================== ChatMessageModel ====================
export interface ChatMessageModel {
  id: string;
  conversationId: string;
  senderType: string;
  senderName?: string;
  senderEmail?: string;
  senderId?: string;
  content: string;
  createdAt: string;
  isAdmin: boolean;
}

export function parseChatMessageModel(json: any): ChatMessageModel {
  return {
    id: json.id,
    conversationId: json.conversationId,
    senderType: json.senderType,
    senderName: json.senderName ?? undefined,
    senderEmail: json.senderEmail ?? undefined,
    senderId: json.senderId ?? undefined,
    content: json.content,
    createdAt: json.createdAt,
    isAdmin: json.senderType === 'ADMIN',
  };
}

// ==================== ChatConversationModel ====================
export interface ChatConversationModel {
  id: string;
  userId: string;
  username: string;
  userEmail?: string;
  avatar?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  messages?: ChatMessageModel[];
  status?: string;
}

export function parseChatConversationModel(json: any): ChatConversationModel {
  return {
    id: json.id,
    userId: json.userId,
    username: json.username,
    userEmail: json.userEmail ?? undefined,
    avatar: json.avatar ?? undefined,
    lastMessageAt: json.lastMessageAt ?? undefined,
    lastMessagePreview: json.lastMessagePreview ?? undefined,
    messages: json.messages?.map(parseChatMessageModel) ?? undefined,
    status: json.status ?? undefined,
  };
}

// ==================== ChatConversationResponseWrapper ====================
export interface ChatConversationResponseWrapper extends BaseResponse {
  data?: ChatConversationModel;
}

export function parseChatConversationResponseWrapper(json: any): ChatConversationResponseWrapper {
  const base = parseBaseResponse(json);
  return {
    ...base,
    data: json.data && typeof json.data === 'object' ? parseChatConversationModel(json.data) : undefined,
  };
}

// ==================== ChatMessageResponseWrapper ====================
export interface ChatMessageResponseWrapper extends BaseResponse {
  data?: ChatMessageModel;
}

export function parseChatMessageResponseWrapper(json: any): ChatMessageResponseWrapper {
  const base = parseBaseResponse(json);
  return {
    ...base,
    data: json.data && typeof json.data === 'object' ? parseChatMessageModel(json.data) : undefined,
  };
}
