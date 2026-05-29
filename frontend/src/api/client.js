import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const TOKEN_STORAGE_KEY = "@gestao-financeira:token";

/*
 * Base URL examples:
 * Android Emulator: http://10.0.2.2:3000
 * iOS Simulator: http://localhost:3000
 * Celular físico: usar IP local da máquina, exemplo http://192.168.0.10:3000
 */
const api = axios.create({
  baseURL: "http://10.10.129.48:3000"
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export { TOKEN_STORAGE_KEY };
export default api;
