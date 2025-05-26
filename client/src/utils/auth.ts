// client/src/utils/auth.ts

import { jwtDecode, JwtPayload } from 'jwt-decode';

interface UserData {
  _id: string;
  username: string;
  email: string;
}

interface AuthTokenPayload extends JwtPayload {
  data: UserData;
}

class AuthService {
  // Note; Key under which the JWT is stored in localStorage
  private static readonly TOKEN_KEY = 'id_token';

  /**
   * Note; Save a JWT to localStorage.
   * @param token - JWT string issued by the server
   */
  login(token: string): void {
    localStorage.setItem(AuthService.TOKEN_KEY, token);
  }

  /**
   * Note; Remove the JWT from localStorage, effectively logging out.
   */
  logout(): void {
    localStorage.removeItem(AuthService.TOKEN_KEY);
  }

  /**
   * Note; Retrieve the JWT from localStorage.
   * @returns the token string, or null if none is stored
   */
  getToken(): string | null {
    return localStorage.getItem(AuthService.TOKEN_KEY);
  }

  /**
   * Note; Decode and return the token payload if valid and not expired.
   *       If the token is missing, malformed, or expired, returns null.
   */
  getProfile(): AuthTokenPayload | null {
    const token = this.getToken();
    if (!token || this.isTokenExpired(token)) {
      this.logout();
      return null;
    }
    try {
      return jwtDecode<AuthTokenPayload>(token);
    } catch {
      // Note; On decode errors (malformed token), clear and return null
      this.logout();
      return null;
    }
  }

  /**
   * Note; Check if the user is currently logged in with a valid token.
   * @returns true if a non-expired token exists
   */
  loggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  /**
   * Note; Determine if a JWT string is expired based on its `exp` claim.
   * @param token - JWT string to inspect
   * @returns true if the token is expired or invalid
   */
  isTokenExpired(token: string): boolean {
    try {
      const { exp } = jwtDecode<JwtPayload>(token);
      // Note; exp is in seconds since epoch
      return exp !== undefined && exp < Date.now() / 1000;
    } catch {
      // Note; If decode fails, treat as expired
      return true;
    }
  }
}

export default new AuthService();
