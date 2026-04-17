import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { theme } from '../theme/theme';

type InputFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  style,
  ...props
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        style={[styles.input, style, error ? styles.inputError : null]}
        placeholderTextColor={theme.colors.textMuted}
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
    fontSize: theme.typography.label,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: theme.typography.body,
    minHeight: 52,
  },
  inputError: {
    borderColor: theme.colors.danger,
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    marginTop: theme.spacing.xs,
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default InputField;
