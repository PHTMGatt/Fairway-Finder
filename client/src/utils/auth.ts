import { type JwtPayload, jwtDecode } from 'jwt-decode';

// Note; Extend JwtPayload to include custom 'data' field
interface ExtendedJwt extends JwtPayload {
  data: {
    username: string;
    email: string;
    _id: string;
  };
}

class AuthService {
  // Note; Get user profile from decoded token, or logout if invalid/expired
  getProfile(): ExtendedJwt | null {
    const token = this.getToken();
    if (!token || this.isTokenExpired(token)) {
      this.logout();
      return null;
    }
    try {
      return jwtDecode<ExtendedJwt>(token);
    } catch {
      this.logout();
      return null;
    }
  }

  // Note; Return true if a valid token exists and is not expired
  loggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  // Note; Decode token and check exp field against current time
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      if (!decoded.exp) return false;
      return decoded.exp < Date.now() / 1000;
    } catch {
      return true; // Note; Treat any decode error as expired
    }
  }

  // Note; Retrieve token string from localStorage
  getToken(): string {
    return localStorage.getItem('id_token') || '';
  }

  // Note; Save JWT to localStorage
  login(idToken: string): void {
    localStorage.setItem('id_token', idToken);
  }

  // Note; Remove JWT from localStorage
  logout(): void {
    localStorage.removeItem('id_token');
  }
}

export default new AuthService();
