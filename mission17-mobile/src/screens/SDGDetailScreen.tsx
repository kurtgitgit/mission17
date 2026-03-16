import React from 'react';
import { 
  View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, SafeAreaView, Platform 
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { SDG_HERO_IMAGES } from '../data/SDGData';

const SDGDetailScreen = ({ route, navigation }: any) => {
  const { sdg } = route.params; // Get the clicked item data

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
             <ChevronLeft color="#0f172a" size={28} />
           </TouchableOpacity>
           <View>
             <Text style={styles.headerLabel}>SDG Learning Hub</Text>
             <Text style={styles.headerTitle}>SDG {sdg.id} - {sdg.title}</Text>
           </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Hero Image Section */}
          <View style={[styles.imageContainer, { backgroundColor: sdg.color + '20' }]}>
            <Image 
              source={SDG_HERO_IMAGES[sdg.id]} 
              style={styles.heroImage} 
              resizeMode="cover"
            />
          </View>

          {/* Description Box */}
          <View style={styles.infoBox}>
            <Text style={styles.descriptionText}>{sdg.description}</Text>
          </View>

          {/* Why It Matters Section */}
          <Text style={styles.sectionTitle}>WHY IT MATTERS?</Text>
          <View style={styles.whyBox}>
            <Text style={styles.whyText}>{sdg.whyItMatters}</Text>
          </View>

          {/* How To Help Section */}
          <Text style={styles.sectionTitle}>HOW TO HELP?</Text>
          <View style={styles.helpBox}>
            {sdg.help.map((tip: string, index: number) => (
              <View key={index} style={styles.bulletItem}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.bulletText}>{tip}</Text>
              </View>
            ))}
            
            <Text style={[styles.bulletText, { marginTop: 15, fontStyle: 'italic', color: '#64748b' }]}>
              Photo Task: Take pictures while performing each activity (ensure privacy).
            </Text>
          </View>


        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  safeArea: { flex: 1 },
  
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  backButton: { marginRight: 15 },
  headerLabel: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  headerTitle: { fontSize: 14, fontWeight: '600', color: '#64748b', marginTop: 2 },

  content: { padding: 20, paddingBottom: 50 },
  
  imageContainer: { 
    width: '100%', 
    height: 220, 
    borderRadius: 24, 
    marginBottom: 25, 
    justifyContent: 'center', 
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  heroImage: { width: '100%', height: '100%' },
  
  infoBox: { backgroundColor: '#f1f5f9', padding: 20, borderRadius: 16, marginBottom: 25 },
  descriptionText: { fontSize: 15, color: '#334155', lineHeight: 24, fontWeight: '500', textAlign: 'justify' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', alignSelf: 'center', marginBottom: 15 },
  
  whyBox: { backgroundColor: '#fff7ed', padding: 20, borderRadius: 16, borderLeftWidth: 4, borderColor: '#fb923c', marginBottom: 25 },
  whyText: { fontSize: 14, color: '#9a3412', lineHeight: 22, fontStyle: 'italic' },
  
  helpBox: { backgroundColor: '#f8fafc', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  bulletItem: { flexDirection: 'row', marginBottom: 12 },
  bulletPoint: { fontSize: 18, color: '#0f172a', marginRight: 10, marginTop: -4 },
  bulletText: { fontSize: 14, color: '#475569', lineHeight: 22, flex: 1 },

});

export default SDGDetailScreen;