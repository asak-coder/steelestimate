import { Linking, Share, Alert, Platform } from 'react-native';

export async function shareOnWhatsApp(message, fallbackPhone = '') {
  const text = encodeURIComponent(message || '');
  const url = `https://wa.me/${fallbackPhone.replace(/\D/g, '')}?text=${text}`;
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }
    await Share.share({ message });
    return true;
  } catch (error) {
    Alert.alert('Share failed', error?.message || 'Unable to share');
    return false;
  }
}

export async function dialPhone(phone) {
  const sanitized = String(phone || '').replace(/\s+/g, '').trim();
  const url = `tel:${sanitized}`;
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen || Platform.OS === 'android' || Platform.OS === 'ios') {
      await Linking.openURL(url);
      return true;
    }
  } catch (error) {
    Alert.alert('Call failed', error?.message || 'Unable to start call');
  }
  return false;
}

export function downloadPdf(url) {
  if (!url) {
    Alert.alert('Download unavailable', 'PDF link is missing.');
    return false;
  }
  Linking.openURL(url).catch((error) => {
    Alert.alert('Download failed', error?.message || 'Unable to open PDF');
  });
  return true;
}