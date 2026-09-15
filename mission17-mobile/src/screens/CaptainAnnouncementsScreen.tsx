import React, { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ArrowLeft, Megaphone, Send, Siren } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { endpoints, getAuthHeaders, GlobalState } from '../config/api';
import { fetchWithTimeout, getFriendlyNetworkMessage } from '../utils/network';

const CaptainAnnouncementsScreen = () => {
  const navigation = useNavigation<any>();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [posting, setPosting] = useState(false);

  const post = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Details required', 'Enter a clear title and message before posting.');
      return;
    }
    setPosting(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetchWithTimeout(endpoints.announcements, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), category: isUrgent ? 'urgent' : 'general', isUrgent, isPinned: isUrgent }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || 'The post could not be saved.');
      setTitle('');
      setBody('');
      setIsUrgent(false);
      Alert.alert(isUrgent ? 'Emergency alert posted' : 'News posted', isUrgent ? 'The alert is live and has been queued for resident notifications.' : 'The announcement is now visible in Barangay Bulletins.');
    } catch (error) {
      Alert.alert('Post not sent', getFriendlyNetworkMessage(error, 'Please check your connection and try again.'));
    } finally {
      setPosting(false);
    }
  };

  if (GlobalState.role !== 'super_admin') {
    return <SafeAreaView style={styles.center}><Text style={styles.denied}>This screen is reserved for the Barangay Captain.</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back"><ArrowLeft color="#fff" size={24} /></TouchableOpacity>
        <View style={{ flex: 1 }}><Text style={styles.headerTitle}>News & Alerts</Text><Text style={styles.headerSub}>Official barangay updates</Text></View>
        {isUrgent ? <Siren color="#fff" size={25} /> : <Megaphone color="#fff" size={25} />}
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.notice, isUrgent && styles.urgentNotice]}>
          <Text style={styles.noticeTitle}>{isUrgent ? 'Emergency alert' : 'Community news'}</Text>
          <Text style={styles.noticeText}>{isUrgent ? 'Residents will see an emergency banner. Notification delivery is queued by the server.' : 'Publish an official update that residents can read in Barangay Bulletins.'}</Text>
        </View>
        <Text style={styles.label}>Title</Text>
        <TextInput value={title} onChangeText={setTitle} maxLength={120} placeholder="e.g. Water service interruption" placeholderTextColor="#64748b" selectionColor="#0038A8" style={styles.input} />
        <Text style={styles.label}>Message</Text>
        <TextInput value={body} onChangeText={setBody} maxLength={1200} multiline textAlignVertical="top" placeholder="Write the official update, schedule, location, and next steps." placeholderTextColor="#64748b" selectionColor="#0038A8" style={[styles.input, styles.message]} />
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}><Text style={styles.toggleTitle}>Mark as emergency alert</Text><Text style={styles.toggleSub}>Use only for urgent safety or public-service advisories.</Text></View>
          <Switch value={isUrgent} onValueChange={setIsUrgent} trackColor={{ false: '#cbd5e1', true: '#fecaca' }} thumbColor={isUrgent ? '#dc2626' : '#f8fafc'} accessibilityLabel="Mark as emergency alert" />
        </View>
        <TouchableOpacity disabled={posting} onPress={() => Alert.alert(isUrgent ? 'Post emergency alert?' : 'Post community news?', isUrgent ? 'This will be visible to residents and queued for notifications.' : 'This will be visible in Barangay Bulletins.', [{ text: 'Cancel', style: 'cancel' }, { text: isUrgent ? 'Post alert' : 'Post news', style: isUrgent ? 'destructive' : 'default', onPress: () => void post() }])} style={[styles.postButton, isUrgent && styles.urgentButton, posting && styles.disabled]} accessibilityRole="button" accessibilityLabel={isUrgent ? 'Post emergency alert' : 'Post community news'}>
          {posting ? <ActivityIndicator color="#fff" /> : <><Send size={18} color="#fff" /><Text style={styles.postText}>{isUrgent ? 'Post emergency alert' : 'Post community news'}</Text></>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#f8fafc' }, denied: { color: '#b91c1c', textAlign: 'center' }, header: { backgroundColor: '#0038A8', padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }, headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900' }, headerSub: { color: '#bfdbfe', fontSize: 12, marginTop: 2 }, content: { padding: 16, paddingBottom: 36 }, notice: { backgroundColor: '#dbeafe', borderRadius: 14, padding: 15, marginBottom: 20 }, urgentNotice: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' }, noticeTitle: { color: '#0f172a', fontSize: 15, fontWeight: '900' }, noticeText: { color: '#475569', fontSize: 12, lineHeight: 18, marginTop: 5 }, label: { color: '#334155', fontSize: 13, fontWeight: '800', marginTop: 13 }, input: { color: '#0f172a', backgroundColor: '#fff', borderWidth: 1, borderColor: '#94a3b8', borderRadius: 10, padding: 13, marginTop: 7, fontSize: 15 }, message: { minHeight: 150 }, toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, marginTop: 18 }, toggleTitle: { color: '#0f172a', fontWeight: '900' }, toggleSub: { color: '#64748b', fontSize: 12, lineHeight: 17, marginTop: 3 }, postButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#0038A8', padding: 15, borderRadius: 10, marginTop: 20 }, urgentButton: { backgroundColor: '#dc2626' }, disabled: { opacity: 0.55 }, postText: { color: '#fff', fontWeight: '900', fontSize: 15 },
});

export default CaptainAnnouncementsScreen;
