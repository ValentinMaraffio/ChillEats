import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  user: { username: string; email: string } | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = await AsyncStorage.getItem('userToken');
      if (storedToken) {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        setUser({ username: payload.username, email: payload.email });
        setToken(storedToken);
      }
    };
    loadUser();
  }, []);

  const login = async (newToken: string) => {
    const payload = JSON.parse(atob(newToken.split('.')[1]));
    setUser({ username: payload.username, email: payload.email });
    setToken(newToken);
    await AsyncStorage.setItem('userToken', newToken);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('userToken');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
