/* eslint-disable react-refresh/only-export-components */
// src/pages/Auth/'AuthContext.tsx'

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import Auth from '../../utils/auth';

interface AuthContextType {
  isLoggedIn: boolean;
  refreshAuth: () => void;
  logoutUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  refreshAuth: () => {},
  logoutUser: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(Auth.loggedIn());

  const refreshAuth = useCallback(() => {
    setIsLoggedIn(Auth.loggedIn());
  }, []);

  const logoutUser = useCallback(() => {
    Auth.logout();
    setIsLoggedIn(false);
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, refreshAuth, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => useContext(AuthContext);
