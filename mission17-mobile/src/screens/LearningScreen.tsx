import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Platform, 
  ViewStyle, 
  SafeAreaView, 
  TextInput
} from 'react-native';
import { Search, PlayCircle, BookOpen, HelpCircle } from 'lucide-react-native';

const LearningScreen = () => {
  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  // Mock Categories
  const categories = [
    { id: 1, title: 'Watch & Learn', icon: PlayCircle, color: '#3b82f6', count: '12 Videos' },
    { id: 2, title: 'Articles', icon: BookOpen, color: '#10b981', count: '8 Reads' },
    { id: 3, title: 'SDG Quizzes', icon: HelpCircle, color: '#f59e0b', count: '5 Quizzes' },
  ];

  return (
    <RootComponent style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SDG Learning Hub</Text>
        <Text style={styles.headerSubtitle}>Master the 17 Goals</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#94a3b8" style={{ marginRight: 10 }} />
          <TextInput 
            placeholder="Search topics..." 
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
        </View>

        {/* FEATURED CARD */}
        <Text style={styles.sectionTitle}>Featured Today</Text>
        <TouchableOpacity style={styles.featuredCard}>
          <View style={styles.featuredContent}>
            <View style={styles.tagContainer}>
              <Text style={styles.tagText}>NEW</Text>
            </View>
            <Text style={styles.featuredTitle}>Why SDG 13 Matters?</Text>
            <Text style={styles.featuredDesc}>An intro to Climate Action and how you can help.</Text>
            <View style={styles.playRow}>
              <PlayCircle size={20} color="white" />
              <Text style={styles.playText}>Watch Now • 5 min</Text>
            </View>
          </View>
          {/* Decorative Circle */}
          <View style={styles.circleDecoration} />
        </TouchableOpacity>

        {/* CATEGORIES GRID */}
        <Text style={styles.sectionTitle}>Browse Categories</Text>
        <View style={styles.grid}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.catCard}>
              <View style={[styles.iconBox, { backgroundColor: cat.color + '20' }]}>
                <cat.icon size={24} color={cat.color} />
              </View>
              <Text style={styles.catTitle}>{cat.title}</Text>
              <Text style={styles.catCount}>{cat.count}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* DID YOU KNOW? */}
        <Text style={styles.sectionTitle}>Did You Know?</Text>
        <View style={styles.factCard}>
          <Text style={styles.factText}>
            "The SDGs were adopted by all United Nations Member States in 2015 as a universal call to action to end poverty."
          </Text>
        </View>
        
        {/* Spacer for Bottom Tab Bar */}
        <View style={{ height: 80 }} />

      </ScrollView>
    </RootComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  } as ViewStyle,
  content: {
    padding: 20,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  } as ViewStyle,

  // HEADER
  header: {
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingHorizontal: 20,
    marginBottom: 10,
  } as ViewStyle,
  headerTitle: {
    fontSize: 28, fontWeight: '800', color: '#0f172a',
  } as ViewStyle,
  headerSubtitle: {
    fontSize: 16, color: '#64748b', marginTop: 5,
  } as ViewStyle,

  // SEARCH
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 25,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  } as ViewStyle,
  searchInput: {
    flex: 1, fontSize: 16, color: '#0f172a',
    // @ts-ignore
    outlineStyle: 'none',
  } as any,

  // FEATURED
  sectionTitle: {
    fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 15,
  } as ViewStyle,
  featuredCard: {
    backgroundColor: '#0f6bba',
    borderRadius: 20,
    padding: 20,
    height: 180,
    justifyContent: 'center',
    marginBottom: 30,
    overflow: 'hidden',
    shadowColor: '#0f6bba', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  } as ViewStyle,
  featuredContent: { zIndex: 2 } as ViewStyle,
  tagContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 10,
  } as ViewStyle,
  tagText: { color: 'white', fontWeight: 'bold', fontSize: 10 } as ViewStyle,
  featuredTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 5 } as ViewStyle,
  featuredDesc: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 15 } as ViewStyle,
  playRow: { flexDirection: 'row', alignItems: 'center', gap: 8 } as ViewStyle,
  playText: { color: 'white', fontWeight: '600', fontSize: 14 } as ViewStyle,
  circleDecoration: {
    position: 'absolute', right: -30, bottom: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.1)',
  } as ViewStyle,

  // GRID
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginBottom: 30,
  } as ViewStyle,
  catCard: {
    flex: 1, minWidth: '30%', backgroundColor: 'white', borderRadius: 16, padding: 15, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  } as ViewStyle,
  iconBox: {
    width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  } as ViewStyle,
  catTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 4 } as ViewStyle,
  catCount: { fontSize: 12, color: '#64748b' } as ViewStyle,

  // FACT
  factCard: {
    backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fcd34d', borderRadius: 16, padding: 20,
  } as ViewStyle,
  factText: {
    fontSize: 14, fontStyle: 'italic', color: '#92400e', lineHeight: 22, textAlign: 'center',
  } as ViewStyle,
});

export default LearningScreen;