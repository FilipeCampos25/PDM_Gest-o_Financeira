import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import api, { TOKEN_STORAGE_KEY } from "../api/client";

const USER_STORAGE_KEY = "@gestao-financeira:user";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  async function saveSession(sessionUser, sessionToken) {
    await AsyncStorage.multiSet([
      [USER_STORAGE_KEY, JSON.stringify(sessionUser)],
      [TOKEN_STORAGE_KEY, sessionToken]
    ]);

    setUser(sessionUser);
    setToken(sessionToken);
  }

  async function signIn({ email, password }) {
    const response = await api.post("/auth/login", {
      email,
      password
    });

    await saveSession(response.data.user, response.data.token);

    return response.data;
  }

  async function signUp({ name, email, password }) {
    await api.post("/auth/register", {
      name,
      email,
      password
    });

    return signIn({
      email,
      password
    });
  }

  async function signOut() {
    await AsyncStorage.multiRemove([USER_STORAGE_KEY, TOKEN_STORAGE_KEY]);

    setUser(null);
    setToken(null);
  }

  useEffect(() => {
    async function loadStoredSession() {
      try {
        const [[, storedUser], [, storedToken]] = await AsyncStorage.multiGet([
          USER_STORAGE_KEY,
          TOKEN_STORAGE_KEY
        ]);

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        }
      } finally {
        setLoading(false);
      }
    }

    loadStoredSession();
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      signIn,
      signUp,
      signOut,
      isAuthenticated: Boolean(user && token)
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
