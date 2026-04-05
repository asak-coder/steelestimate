import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@tekla_ai_token';

const tokenStorage = {
  async getToken() {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      return null;
    }
  },

  async setToken(token) {
    try {
      if (!token) {
        await AsyncStorage.removeItem(TOKEN_KEY);
        return;
      }
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      return;
    }
  },

  async clearToken() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      return;
    }
  },
};

export default tokenStorage;