import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ArrowLeft, Megaphone, Send, Siren } from 'lucide-react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { endpoints, getAuthHeaders, GlobalState } from '../config/api';
import { fetchWithTimeout, getFriendlyNetworkMessage } from '../utils/network';

const CaptainAnnouncementsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [posting, setPosting] = useState(false);
  const [duration, setDuration] = useState('7');
  const [view, setView] = useState('active');
  const [posts, setPosts] = useState<any[]>([]);
  const [listError, setListError] = useState('');
  const [busyId, setBusyId] = useState('');
  const submittingRef = useRef(false);
  const archiveRef = useRef(false);
  const listRequestRef = useRef(0);

  const loadPosts = useCallback(async () => {
    if (GlobalState.role !== 'super_admin') return;
    const request=++listRequestRef.current;
    try {
      const response = await fetchWithTimeout(`${endpoints.announcements}/manage?view=${view}`, {headers:await getAuthHeaders()});
      const data = await response.json();
      if(!response.ok) throw new Error(data.message || 'Posts are unavailable.');
      if(request===listRequestRef.current){setPosts(Array.isArray(data)?data:[]);setListError('');}
    } catch(error) { if(request===listRequestRef.current){setPosts([]);setListError(getFriendlyNetworkMessage(error, 'Posts could not be loaded. Tap Refresh to retry.'));} }
  }, [view]);
  useFocusEffect(useCallback(()=>{void loadPosts();return ()=>{listRequestRef.current++;};},[loadPosts]));

  useEffect(() => {
    setIsUrgent(Boolean(route.params?.emergency));
    setDuration(route.params?.emergency?'1':'7');
  }, [route.params?.emergency]);

  const post = async () => {
    if(submittingRef.current) return;
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    if (cleanTitle.length < 3 || cleanBody.length < 10) {
      Alert.alert('Details required', 'Enter a title of at least 3 characters and a message of at least 10 characters before posting.');
      return;
    }
    const days=Number(duration);
    if(!/^\d+$/.test(duration)||!Number.isInteger(days)||days<1||days>365) { Alert.alert('Check expiration','Enter a visibility duration from 1 to 365 days.');return; }
    submittingRef.current=true;
    setPosting(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetchWithTimeout(endpoints.announcements, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: cleanTitle, body: cleanBody, category: isUrgent ? 'urgent' : 'general', isUrgent, isPinned: isUrgent, expiresAt:new Date(Date.now()+days*86400000).toISOString() }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || 'The post could not be saved.');
      setTitle('');
      setBody('');
      setIsUrgent(false);
      setDuration('7');void loadPosts();
      Alert.alert(isUrgent ? 'Emergency alert posted' : 'News posted', isUrgent ? 'The alert is live and has been queued for resident notifications.' : 'The announcement is now visible in Barangay Bulletins.');
    } catch (error) {
      const message = error instanceof Error && error.message && !/network request failed|failed to fetch|network/i.test(error.message)
        ? error.message
        : getFriendlyNetworkMessage(error, 'Please check your connection and try again.');
      Alert.alert('Post not sent', message);
    } finally {
      setPosting(false);
      submittingRef.current=false;
    }
  };

  const changeArchive = async (item:any, restoring:boolean) => {
    if(archiveRef.current)return;
    const days=Number(duration);
    if(restoring&&(!/^\d+$/.test(duration)||!Number.isInteger(days)||days<1||days>365)){Alert.alert('Check expiration','Enter 1 to 365 days before restoring.');return;}
    archiveRef.current=true;setBusyId(item._id);
    try {
      const response=await fetchWithTimeout(`${endpoints.announcements}/${item._id}/archive`,{method:'PATCH',headers:{...(await getAuthHeaders()),'Content-Type':'application/json'},body:JSON.stringify({archived:!restoring,...(restoring?{expiresAt:new Date(Date.now()+days*86400000).toISOString()}:{})})});
      const data=await response.json();if(!response.ok)throw new Error(data.message||'Post not updated.');
      await loadPosts();
    } catch(error){Alert.alert('Post not updated',error instanceof Error?error.message:'Please try again.');}
    finally{archiveRef.current=false;setBusyId('');}
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
          <Switch value={isUrgent} onValueChange={value=>{setIsUrgent(value);setDuration(value?'1':'7');}} trackColor={{ false: '#cbd5e1', true: '#fecaca' }} thumbColor={isUrgent ? '#dc2626' : '#f8fafc'} accessibilityLabel="Mark as emergency alert" />
        </View>
        <Text style={styles.label}>Visible for (days)</Text>
        <TextInput accessibilityLabel="Post visibility in days" value={duration} onChangeText={setDuration} keyboardType="number-pad" maxLength={3} style={styles.input}/>
        <Text selectable style={styles.noticeText}>{Number(duration)>=1&&Number(duration)<=365?`Expires ${new Date(Date.now()+Number(duration)*86400000).toLocaleString('en-PH',{timeZone:'Asia/Manila'})} (Philippine time).`:'Enter 1 to 365 days.'} Expired posts leave residents’ feeds but remain available here.</Text>
        <TouchableOpacity disabled={posting} onPress={() => Alert.alert(isUrgent ? 'Post emergency alert?' : 'Post community news?', isUrgent ? 'This will be visible to residents and queued for notifications.' : 'This will be visible in Barangay Bulletins.', [{ text: 'Cancel', style: 'cancel' }, { text: isUrgent ? 'Post alert' : 'Post news', style: isUrgent ? 'destructive' : 'default', onPress: () => void post() }])} style={[styles.postButton, isUrgent && styles.urgentButton, posting && styles.disabled]} accessibilityRole="button" accessibilityLabel={isUrgent ? 'Post emergency alert' : 'Post community news'}>
          {posting ? <ActivityIndicator color="#fff" /> : <><Send size={18} color="#fff" /><Text style={styles.postText}>{isUrgent ? 'Post emergency alert' : 'Post community news'}</Text></>}
        </TouchableOpacity>
        <Text style={[styles.label,{marginTop:30,fontSize:18}]}>Manage posts</Text>
        <View style={{flexDirection:'row',gap:8,marginVertical:12}}>{['active','expired','archived'].map(tab=><TouchableOpacity key={tab} accessibilityRole="button" accessibilityState={{selected:view===tab}} onPress={()=>{if(view!==tab){listRequestRef.current++;setPosts([]);setView(tab);}}} style={{padding:12,borderRadius:8,backgroundColor:view===tab?'#0038a8':'#e2e8f0'}}><Text style={{color:view===tab?'#fff':'#334155'}}>{tab==='active'?'Current':tab==='expired'?'Expired':'Archived'}</Text></TouchableOpacity>)}</View>
        <TouchableOpacity onPress={()=>void loadPosts()} accessibilityRole="button" style={{padding:12}}><Text style={{color:'#0038a8'}}>Refresh posts</Text></TouchableOpacity>
        {!!listError&&<Text selectable accessibilityRole="alert" style={{color:'#b91c1c'}}>{listError}</Text>}
        {!listError&&!posts.length&&<Text style={styles.noticeText}>No posts in this view.</Text>}
        {posts.map(item=>{const restoring=!!item.isArchived||item.isActive===false||view==='expired';return <View key={item._id} style={[styles.notice,{backgroundColor:'#fff',marginTop:10}]}><Text selectable style={styles.noticeTitle}>{item.title}</Text><Text selectable style={styles.noticeText}>{item.expiresAt?`Expires ${new Date(item.expiresAt).toLocaleString('en-PH',{timeZone:'Asia/Manila'})} (PH)`:'No expiration (legacy post)'}</Text><TouchableOpacity disabled={!!busyId} accessibilityRole="button" onPress={()=>Alert.alert(restoring?'Restore post?':'Archive post?',restoring?`This post will return to residents’ feeds for ${duration} days.`:'This hides the post without deleting it.',[{text:'Cancel',style:'cancel'},{text:restoring?'Restore':'Archive',onPress:()=>void changeArchive(item,restoring)}])} style={{paddingVertical:14}}><Text style={{color:'#0038a8',fontWeight:'700'}}>{busyId===item._id?'Saving…':restoring?'Restore with new expiration':'Archive'}</Text></TouchableOpacity></View>;})}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#f8fafc' }, denied: { color: '#b91c1c', textAlign: 'center' }, header: { backgroundColor: '#0038A8', padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }, headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900' }, headerSub: { color: '#bfdbfe', fontSize: 12, marginTop: 2 }, content: { padding: 16, paddingBottom: 36 }, notice: { backgroundColor: '#dbeafe', borderRadius: 14, padding: 15, marginBottom: 20 }, urgentNotice: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' }, noticeTitle: { color: '#0f172a', fontSize: 15, fontWeight: '900' }, noticeText: { color: '#475569', fontSize: 12, lineHeight: 18, marginTop: 5 }, label: { color: '#334155', fontSize: 13, fontWeight: '800', marginTop: 13 }, input: { color: '#0f172a', backgroundColor: '#fff', borderWidth: 1, borderColor: '#94a3b8', borderRadius: 10, padding: 13, marginTop: 7, fontSize: 15 }, message: { minHeight: 150 }, toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, marginTop: 18 }, toggleTitle: { color: '#0f172a', fontWeight: '900' }, toggleSub: { color: '#64748b', fontSize: 12, lineHeight: 17, marginTop: 3 }, postButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#0038A8', padding: 15, borderRadius: 10, marginTop: 20 }, urgentButton: { backgroundColor: '#dc2626' }, disabled: { opacity: 0.55 }, postText: { color: '#fff', fontWeight: '900', fontSize: 15 },
});

export default CaptainAnnouncementsScreen;
