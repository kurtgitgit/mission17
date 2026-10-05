import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Image, TextInput,
  TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { ArrowLeft, Send, Bot, User, MessageCircleQuestion } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { endpoints } from '../config/api';
import { colors, spacing, radius, shadow, sharedStyles } from '../config/theme';
import { ChatMessage, useChat } from '../context/ChatContext';

const missionLogo = require('../../assets/logo.png');

const FAQ_SECTIONS = [
  {
    title: 'Get started',
    questions: [
      'What can BrgyLink help me do?',
      'How do I request a Barangay Clearance?',
      'How do I file a blotter report?',
    ],
  },
  {
    title: 'Account & app help',
    questions: [
      'How do I check my document request status?',
      'I forgot my password. What should I do?',
      'I did not receive my verification code.',
    ],
  },
  {
    title: 'Barangay information',
    questions: [
      'Who are the current barangay officials?',
      'Where can I find barangay announcements?',
    ],
  },
];

const ChatBotScreen = () => {
  const navigation = useNavigation<any>();
  const { messages, setMessages } = useChat();
  const [input, setInput] = useState('');
  const [loading, setLoading]   = useState(false);
  const listRef = useRef<FlatList>(null);
  const isStarter = messages.length <= 1;
  const visibleMessages = messages.slice(1);

  const sendMessage = async (question = input) => {
    const text = question.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), text, isBot: false };

    // Capture history BEFORE adding the new user message (exclude initial greeting)
    const history = messages.slice(1).map(m => ({ text: m.text, isBot: m.isBot }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      const res  = await fetch(`${endpoints.auth.backendBaseUrl}/api/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`Chatbot request failed (${res.status})`);
      const data = await res.json();
      const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), text: data.reply ?? "Sorry, I couldn't understand that.", isBot: true };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: "Sorry, I'm having trouble connecting right now. Please try again.", isBot: true }]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => (
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

  const renderSuggestions = () => (
    <View style={styles.suggestions}>
      {FAQ_SECTIONS.map(section => (
        <View key={section.title} style={styles.faqSection}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.faqList}>
            {section.questions.map(question => (
              <TouchableOpacity
                key={question}
                style={[styles.faqButton, loading && styles.faqButtonDisabled]}
                onPress={() => sendMessage(question)}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel={question}
              >
                <View style={styles.faqIcon}><MessageCircleQuestion size={18} color={colors.primary} /></View>
                <Text style={styles.faqButtonText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
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
          <Text style={styles.headerSub}>● Ready to help</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.chatArea} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          ref={listRef}
          data={visibleMessages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => !isStarter && listRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={isStarter ? (
            <View style={styles.landing}>
              <View style={styles.logoHalo}>
                <Image source={missionLogo} style={styles.logo} resizeMode="contain" />
              </View>
              <Text style={styles.landingTitle}>BrgyLink AI</Text>
              <Text style={styles.landingCopy}>Your Barangay Bagong Pag-asa assistant. Tap a question below or ask about BrgyLink anytime.</Text>
              {renderSuggestions()}
            </View>
          ) : null}
          ListFooterComponent={loading ? (
            <View style={styles.typingRow}>
              <View style={styles.avatar}><Bot size={16} color="white" /></View>
              <View style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            </View>
          ) : null}
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask about BrgyLink..."
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
            editable={!loading}
            accessibilityLabel="Ask BrgyLink AI a question"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
            accessibilityRole="button"
            accessibilityLabel="Send message"
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
  chatArea:     { flex: 1 },
  list:         { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.md, flexGrow: 1 },
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

  landing:      { alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.md },
  logoHalo: {
    width: 98, height: 98, borderRadius: 49, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  logo:         { width: 76, height: 76 },
  landingTitle: { color: colors.textPrimary, fontSize: 25, fontWeight: '800', letterSpacing: -0.5 },
  landingCopy: {
    color: colors.textSecondary, fontSize: 14, lineHeight: 20, textAlign: 'center',
    marginTop: spacing.sm, maxWidth: 340,
  },
  suggestions:  { width: '100%', marginTop: spacing.xl, gap: spacing.lg },
  faqSection:   { gap: spacing.sm },
  sectionTitle: { color: colors.textSecondary, fontSize: 14, fontWeight: '700', paddingLeft: 2 },
  faqList:      { gap: spacing.sm },
  faqButton: {
    minHeight: 62, paddingHorizontal: spacing.md, paddingVertical: 12, borderRadius: radius.lg,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, ...shadow.sm,
  },
  faqIcon: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  faqButtonDisabled: { opacity: 0.55 },
  faqButtonText: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', flex: 1, lineHeight: 19 },

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
