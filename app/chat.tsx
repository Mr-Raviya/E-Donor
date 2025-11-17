import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppearance } from './contexts/AppearanceContext';
import { useLocalization } from './contexts/LocalizationContext';

type Chat = {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
};

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: string;
};

const chats: Chat[] = [
  {
    id: '1',
    name: 'City General Hospital',
    avatar: 'CGH',
    lastMessage: 'Thank you for your donation',
    timestamp: '2 hours ago',
    unread: 0,
  },
  {
    id: '2',
    name: 'Central Medical Center',
    avatar: 'CMC',
    lastMessage: 'We need more donors urgently',
    timestamp: '5 hours ago',
    unread: 2,
  },
  {
    id: '3',
    name: 'Blood Bank Center',
    avatar: 'BBC',
    lastMessage: 'Your blood type is in high demand',
    timestamp: '1 day ago',
    unread: 0,
  },
];

const messages: Message[] = [
  {
    id: '1',
    text: 'Hello! Thank you for your donation',
    sender: 'other',
    timestamp: '10:30 AM',
  },
  {
    id: '2',
    text: 'You are welcome! Always happy to help',
    sender: 'user',
    timestamp: '10:35 AM',
  },
  {
    id: '3',
    text: 'Your blood type O+ is very valuable. We would love to have more donations from you',
    sender: 'other',
    timestamp: '10:40 AM',
  },
  {
    id: '4',
    text: 'Sure, I will donate again next month',
    sender: 'user',
    timestamp: '10:42 AM',
  },
];

export default function ChatScreen() {
  const router = useRouter();
  const { t } = useLocalization();
  const { themeMode } = useAppearance();
  const isDark = themeMode === 'dark';
  const params = useLocalSearchParams<{ facilityName?: string; facilityId?: string }>();
  const [selectedChat, setSelectedChat] = useState<string | null>(params.facilityId || null);
  const [messageText, setMessageText] = useState('');
  const [allMessages, setAllMessages] = useState<Message[]>(messages);

  const colors = {
    primary: '#DC2626',
    primaryLight: '#FEE2E2',
    backgroundSecondary: isDark ? '#1F2937' : '#F3F4F6',
    cardBackground: isDark ? '#374151' : '#FFFFFF',
    text: isDark ? '#F9FAFB' : '#111827',
    textSecondary: isDark ? '#D1D5DB' : '#6B7280',
    border: isDark ? '#4B5563' : '#E5E7EB',
  };

  const styles = createStyles(isDark);

  // If opened from a request, create a new chat with that facility
  const facilityChatName = params.facilityName;
  const currentChat = facilityChatName 
    ? { id: params.facilityId, name: facilityChatName, avatar: facilityChatName.split(' ')[0] }
    : chats.find((c) => c.id === selectedChat);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      const newMessage: Message = {
        id: (allMessages.length + 1).toString(),
        text: messageText,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setAllMessages([...allMessages, newMessage]);
      setMessageText('');
    }
  };

  if (selectedChat && currentChat) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatContainer}
        >
          {/* Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity
              onPress={() => setSelectedChat(null)}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color={isDark ? '#fff' : '#1a1a1a'} />
            </TouchableOpacity>
            <View style={styles.chatHeaderInfo}>
              <View style={styles.chatAvatar}>
                <Text style={styles.chatAvatarText}>{currentChat.avatar}</Text>
              </View>
              <Text style={styles.chatName}>{currentChat.name}</Text>
            </View>
            <TouchableOpacity style={styles.optionsButton}>
              <Ionicons name="ellipsis-vertical" size={20} color={isDark ? '#fff' : '#1a1a1a'} />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {allMessages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageRow,
                  message.sender === 'user' && styles.messageRowUser,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    message.sender === 'user' &&
                      styles.messageBubbleUser,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      message.sender === 'user' &&
                        styles.messageTextUser,
                    ]}
                  >
                    {message.text}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      message.sender === 'user' &&
                        styles.messageTimeUser,
                    ]}
                  >
                    {message.timestamp}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={t('typeMessage')}
              placeholderTextColor={colors.textSecondary}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerCard}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButtonAlt}
        >
          <Ionicons name="chevron-back" size={24} color={isDark ? '#fff' : '#1a1a1a'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('messages')}</Text>
        <View style={{ width: 40, height: 40 }} />
      </View>

      <View style={styles.bodyWrapper}>
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chatItem}
              onPress={() => setSelectedChat(item.id)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isDark ? ['#374151', '#4B5563'] : ['#FFFFFF', '#F9FAFB']}
                style={styles.chatItemGradient}
              >
                <View style={styles.chatItemAvatar}>
                  <Text style={styles.chatItemAvatarText}>{item.avatar}</Text>
                </View>
                <View style={styles.chatItemContent}>
                  <View style={styles.chatItemHeader}>
                    <Text style={styles.chatItemName}>{item.name}</Text>
                    <Text style={styles.chatItemTime}>{item.timestamp}</Text>
                  </View>
                  <Text
                    style={styles.chatItemMessage}
                    numberOfLines={1}
                  >
                    {item.lastMessage}
                  </Text>
                </View>
                {item.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{item.unread}</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) => {
  const colors = {
    primary: '#DC2626',
    primaryLight: '#FEE2E2',
    backgroundSecondary: isDark ? '#1F2937' : '#F3F4F6',
    cardBackground: isDark ? '#374151' : '#FFFFFF',
    text: isDark ? '#F9FAFB' : '#111827',
    textSecondary: isDark ? '#D1D5DB' : '#6B7280',
    border: isDark ? '#4B5563' : '#E5E7EB',
  };
  const baseFontSize = 14;
  
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    headerCard: {
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'space-between',
      flexDirection: 'row',
      width: '100%',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#3a3a3a' : '#e0e0e0',
    },
    backButtonAlt: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      zIndex: 10,
    },
    headerTitle: {
      position: 'absolute',
      left: 0,
      right: 0,
      textAlign: 'center',
      fontSize: baseFontSize + 4,
      fontWeight: '700',
      color: isDark ? '#fff' : '#1a1a1a',
      letterSpacing: 0.3,
      pointerEvents: 'none',
    },
    bodyWrapper: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
      width: '100%',
    },
    chatList: {
      padding: 16,
      paddingBottom: 20,
    },
    chatItem: {
      marginBottom: 12,
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 12,
      elevation: 6,
    },
    chatItemGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    chatItemAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
      shadowColor: colors.primary,
      shadowOpacity: 0.3,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      elevation: 4,
    },
    chatItemAvatarText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: baseFontSize,
    },
    chatItemContent: {
      flex: 1,
    },
    chatItemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    chatItemName: {
      fontSize: baseFontSize + 1,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: 0.3,
    },
    chatItemTime: {
      fontSize: baseFontSize - 2,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    chatItemMessage: {
      fontSize: baseFontSize - 1,
      color: colors.textSecondary,
      fontWeight: '400',
    },
    unreadBadge: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      minWidth: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
      paddingHorizontal: 8,
      shadowColor: colors.primary,
      shadowOpacity: 0.4,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 3,
    },
    unreadBadgeText: {
      color: '#FFFFFF',
      fontSize: baseFontSize - 1,
      fontWeight: '700',
    },
    chatContainer: {
      flex: 1,
    },
    chatHeader: {
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#3a3a3a' : '#e0e0e0',
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      borderRadius: 20,
    },
    chatHeaderInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 12,
    },
    chatAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#DC2626',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 3,
    },
    chatAvatarText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: baseFontSize,
    },
    chatName: {
      fontSize: baseFontSize + 2,
      fontWeight: '700',
      color: isDark ? '#fff' : '#1a1a1a',
      letterSpacing: 0.3,
    },
    optionsButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      borderRadius: 20,
    },
    messagesContainer: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    messagesContent: {
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    messageRow: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      marginBottom: 12,
    },
    messageRowUser: {
      justifyContent: 'flex-end',
    },
    messageBubble: {
      maxWidth: '80%',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 20,
      backgroundColor: colors.cardBackground,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 2,
    },
    messageBubbleUser: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.3,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      elevation: 3,
    },
    messageText: {
      fontSize: baseFontSize,
      color: colors.text,
      lineHeight: 20,
    },
    messageTextUser: {
      color: '#FFFFFF',
    },
    messageTime: {
      fontSize: baseFontSize - 3,
      color: colors.textSecondary,
      marginTop: 6,
      fontWeight: '500',
    },
    messageTimeUser: {
      color: 'rgba(255,255,255,0.7)',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: colors.cardBackground,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 10,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: -2 },
      shadowRadius: 8,
      elevation: 4,
    },
    input: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 24,
      fontSize: baseFontSize,
      color: colors.text,
      maxHeight: 100,
    },
    sendButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOpacity: 0.4,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      elevation: 4,
    },
  });
};
