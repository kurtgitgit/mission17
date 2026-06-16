import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { ArrowLeft, Send, Bot, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { endpoints } from '../config/api';
import { colors, spacing, radius, shadow, sharedStyles, typography } from '../config/theme';

type Message = { id: string; text: string; isBot: boolean };

const INITIAL_MESSAGES: Message[] = [
  {
    id: '0',
    text: "Mabuhay! 🏛️ I'm your Barangay Pantal digital assistant. I can help you with Blotter Reports, document requests, barangay services, and SDG missions. How can I assist you today?",
    isBot: true
  }
];

const ChatBotScreen = () => {
  const navigation = useNavigation<any>();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const listRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { id: Date.now().toString(), text, isBot: false };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res  = await fetch(`${endpoints.auth.backendBaseUrl}/api/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const botMsg: Message = { id: (Date.now() + 1).toString(), text: data.reply ?? "Sorry, I couldn't understand that.", isBot: true };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: "Sorry, I'm having trouble connecting right now. Please try again.", isBot: true }]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[styles.row, item.isBot ? styles.rowBot : styles.rowUser]}>
      {item.isBot && (
        <View style={styles.avatar}>
          <Bot size={16} color="white" />
        </View>
      )}
      <View style={[styles.bubble, item.isBot ? styles.bubbleBot : styles.bubbleUser]}>
        <Text style={[styles.bubbleText, item.isBot ? styles.bubbleTextBot : styles.bubbleTextUser]}>
          {item.text}
        </Text>
      </View>
      {!item.isBot && (
        <View style={[styles.avatar, { backgroundColor: colors.border }]}>
          <User size={16} color={colors.textSecondary} />
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      {/* HEADER */}
      <View style={sharedStyles.header}>
        <TouchableOpacity style={sharedStyles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={sharedStyles.headerTitle}>Barangay Assistant</Text>
          <Text style={styles.headerSub}>● Online</Text>
        </View>
      </View>

      {/* CHAT */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={loading ? (
            <View style={styles.typingRow}>
              <View style={styles.avatar}><Bot size={16} color="white" /></View>
              <View style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            </View>
          ) : null}
        />

        {/* INPUT BAR */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || loading}
          >
            <Send size={18} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.background },
  list:         { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.md },
  headerInfo:   { flex: 1 },
  headerSub:    { fontSize: 11, color: '#86efac', fontWeight: '600', marginTop: 1 },

  row:          { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, maxWidth: '90%' },
  rowBot:       { alignSelf: 'flex-start' },
  rowUser:      { alignSelf: 'flex-end', flexDirection: 'row-reverse' },

  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  bubble: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: radius.lg, flexShrink: 1,
  },
  bubbleBot:       { backgroundColor: colors.surface, borderBottomLeftRadius: 4, ...shadow.sm, borderWidth: 1, borderColor: colors.border },
  bubbleUser:      { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleText:      { fontSize: 14, lineHeight: 20 },
  bubbleTextBot:   { color: colors.textPrimary },
  bubbleTextUser:  { color: 'white' },

  typingRow:    { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, maxWidth: '90%' },
  typingBubble: { paddingVertical: 12, paddingHorizontal: 16 },

  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  textInput: {
    flex: 1, backgroundColor: colors.background, borderRadius: radius.xl,
    paddingHorizontal: spacing.md, paddingVertical: 11,
    fontSize: 14, color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.border,
  },
  sendBtn:         { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: colors.border },
});

export default ChatBotScreen;
