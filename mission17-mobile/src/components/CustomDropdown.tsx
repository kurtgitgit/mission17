import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback, ScrollView, Keyboard } from 'react-native';
import { ChevronDown } from 'lucide-react-native';

const CustomDropdown = ({ 
  label, 
  value, 
  options, 
  onSelect, 
  required = false 
}: { 
  label: string; 
  value: string; 
  options: string[]; 
  onSelect: (val: string) => void; 
  required?: boolean; 
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.inputContainer}>
      <TouchableOpacity 
        style={styles.dropdownTrigger}
        onPress={() => { Keyboard.dismiss(); setVisible(true); }}
      >
        <Text style={{ color: value ? '#1e293b' : '#94a3b8', fontSize: 15 }}>
          {value || label}
          {required && !value && <Text style={{ color: '#ef4444', fontWeight: 'bold' }}> *</Text>}
        </Text>
        <ChevronDown color="#94a3b8" size={20} />
      </TouchableOpacity>
      
      <Modal visible={visible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select {label}</Text>
              <ScrollView style={{ maxHeight: 300 }}>
                {options.map((opt) => (
                  <TouchableOpacity 
                    key={opt} 
                    style={styles.modalOption}
                    onPress={() => { onSelect(opt); setVisible(false); }}
                  >
                    <Text style={[styles.modalOptionText, value === opt && styles.modalOptionTextSelected]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', 
    borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 16, height: 54,
  },
  dropdownTrigger: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 12, padding: 16, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 16, textAlign: 'center' },
  modalOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalOptionText: { fontSize: 16, color: '#475569', textAlign: 'center' },
  modalOptionTextSelected: { color: '#0038A8', fontWeight: 'bold' },
});

export default CustomDropdown;
