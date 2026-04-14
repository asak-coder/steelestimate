const React = require('react');
const { useState } = React;
const { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Alert } = require('react-native');
const { createLead } = require('../services/leadService');
const { shouldTriggerLeadCapture } = require('../services/estimateService');

function Input(props) {
  return React.createElement(TextInput, props);
}

function LeadFormScreen({ route, navigation }) {
  const estimate = route && route.params ? route.params.estimate : null;
  const tonnage = estimate && estimate.steel ? estimate.steel.weightTons : 0;
  const prefilledProject = estimate && estimate.payload && estimate.payload.projectName ? estimate.payload.projectName : '';

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(prefilledProject);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    try {
      await createLead({
        estimateId: estimate && estimate.id ? estimate.id : '',
        projectId: estimate && estimate.payload ? estimate.payload.projectName : '',
        name,
        company,
        email,
        phone,
        message,
        tonnage,
        source: 'mobile-app',
        consent: true,
      });
      Alert.alert('Lead submitted', 'Your enquiry has been sent successfully.');
      navigation.navigate('HomeScreen');
    } catch (error) {
      Alert.alert('Submission failed', error.message || 'Unable to submit lead.');
    } finally {
      setLoading(false);
    }
  };

  const valid = Boolean(name.trim() && (email.trim() || phone.trim()));

  return React.createElement(ScrollView, { style: styles.container, contentContainerStyle: styles.content },
    React.createElement(Text, style: styles.title, 'Lead capture'),
    React.createElement(Text, style: styles.subtitle, 'Please share your details and we will contact you.'),
    React.createElement(TextInput, { style: styles.input, value: name, onChangeText: setName, placeholder: 'Name', placeholderTextColor: '#7f8c8d' }),
    React.createElement(TextInput, { style: styles.input, value: company, onChangeText: setCompany, placeholder: 'Company', placeholderTextColor: '#7f8c8d' }),
    React.createElement(TextInput, { style: styles.input, value: email, onChangeText: setEmail, placeholder: 'Email', placeholderTextColor: '#7f8c8d', keyboardType: 'email-address' }),
    React.createElement(TextInput, { style: styles.input, value: phone, onChangeText: setPhone, placeholder: 'Phone', placeholderTextColor: '#7f8c8d', keyboardType: 'phone-pad' }),
    React.createElement(TextInput, { style: [styles.input, styles.multiline], value: message, onChangeText: setMessage, placeholder: 'Message', placeholderTextColor: '#7f8c8d', multiline: true }),
    React.createElement(Pressable, { style: [styles.button, !valid && styles.buttonDisabled], onPress: onSubmit, disabled: !valid || loading },
      React.createElement(Text, style: styles.buttonText, loading ? 'Submitting...' : 'Submit enquiry')
    )
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111821' },
  content: { padding: 20, gap: 14 },
  title: { color: '#fff', fontSize: 26, fontWeight: '700' },
  subtitle: { color: '#c3cbd4', fontSize: 14, lineHeight: 20 },
  input: { backgroundColor: '#1a2430', borderColor: '#304050', borderWidth: 1, borderRadius: 12, color: '#fff', paddingHorizontal: 14, paddingVertical: 12 },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  button: { backgroundColor: '#f0c674', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#101820', fontWeight: '700', fontSize: 16 },
});

module.exports = LeadFormScreen;