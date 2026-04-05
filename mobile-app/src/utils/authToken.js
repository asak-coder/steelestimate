import tokenStorage from './tokenStorage';

let memoryToken = null;

const authToken = {
  async get() {
    if (memoryToken) {
      return memoryToken;
    }

    memoryToken = await tokenStorage.getToken();
    return memoryToken;
  },

  async set(token) {
    memoryToken = token || null;
    await tokenStorage.setToken(token || null);
  },

  async clear() {
    memoryToken = null;
    await tokenStorage.clearToken();
  },
};

export default authToken;