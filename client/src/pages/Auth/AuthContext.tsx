/* eslint-disable react-refresh/only-export-components */
// src/pages/Auth/AuthContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import Auth from '../../utils/auth';

interface AuthContextType {
  isLoggedIn: boolean;  // Note; Indicates whether a valid token is present
  refreshAuth: () => void;  // Note; Re-checks login status
  logoutUser: () => void;   // Note; Clears token and updates context
}

// Note; Default context values (used only before initialization)
const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  refreshAuth: () => {},
  logoutUser: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

// Note; Provides auth state & actions to the app
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Note; Local state tracks whether the user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(Auth.loggedIn());

  // Note; Refresh login status (e.g., after token update)
  const refreshAuth = () => {
    setIsLoggedIn(Auth.loggedIn());
  };

  // Note; Logout action: clear token and update state
  const logoutUser = () => {
    Auth.logout();
    setIsLoggedIn(false);
  };

  // Note; On mount, ensure state reflects current token
  useEffect(() => {
    refreshAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, refreshAuth, logoutUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Note; Custom hook to consume auth context
export const useAuth = (): AuthContextType => {
  return useContext(AuthContext);
};
