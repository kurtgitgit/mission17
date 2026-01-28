import React from 'react';
import { 
  View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, SafeAreaView, Platform 
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

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
          
          {/* Hero Image */}
          <Image source={{ uri: sdg.image }} style={styles.heroImage} />

          {/* Description Box */}
          <View style={styles.infoBox}>
            <Text style={styles.descriptionText}>{sdg.description}</Text>
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

          {/* Logo Footer */}
          <View style={styles.footer}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6182/6182992.png' }} 
              style={{ width: 60, height: 60, opacity: 0.8 }} 
            />
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
  
  heroImage: { width: '100%', height: 220, borderRadius: 16, marginBottom: 20 },
  
  infoBox: { backgroundColor: '#f1f5f9', padding: 20, borderRadius: 16, marginBottom: 25 },
  descriptionText: { fontSize: 15, color: '#334155', lineHeight: 24, fontWeight: '500' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', alignSelf: 'center', marginBottom: 15 },
  
  helpBox: { backgroundColor: '#f8fafc', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  bulletItem: { flexDirection: 'row', marginBottom: 12 },
  bulletPoint: { fontSize: 18, color: '#0f172a', marginRight: 10, marginTop: -4 },
  bulletText: { fontSize: 14, color: '#475569', lineHeight: 22, flex: 1 },

  footer: { alignItems: 'center', marginTop: 40 },
});

export default SDGDetailScreen;