import React from 'react';
import { View, TextInput, Text, StyleSheet, Platform, KeyboardTypeOptions } from 'react-native';

interface FormInputProps {
  placeholder: string;
  value: string;
  onChangeText: (val: string) => void;
  keyboardType?: KeyboardTypeOptions;
  required?: boolean;
  editable?: boolean;
  secureTextEntry?: boolean;
  containerStyle?: object;
  rightIcon?: React.ReactNode;
}

const FormInput = ({
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  required = false,
  editable = true,
  secureTextEntry = false,
  containerStyle,
  rightIcon
}: FormInputProps) => {
  const webInputStyle = Platform.OS === 'web' ? { outlineStyle: 'none' } : {};

  return (
    <View style={[styles.inputContainer, !editable && { backgroundColor: '#f1f5f9' }, containerStyle]}>
      <TextInput 
        placeholder={placeholder} 
        style={[styles.input, webInputStyle as any]} 
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor="#94a3b8"
        editable={editable}
        secureTextEntry={secureTextEntry}
      />
      {required && <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: 'bold', marginLeft: 8 }}>*</Text>}
      {rightIcon}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', 
    borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 16, height: 54,
  },
  input: { flex: 1, fontSize: 15, color: '#1e293b', height: '100%' },
});

export default FormInput;
