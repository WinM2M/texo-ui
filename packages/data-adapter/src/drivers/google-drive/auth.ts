import { StorageError, StorageErrorCode } from '../../errors';

export interface GoogleAuthConfig {
  clientId: string;
  scopes?: string[];
  redirectUri?: string;
}

export interface GoogleAuthToken {
  accessToken: string;
  expiresAt: number;
}

export class GoogleAuthManager {
  private readonly config: GoogleAuthConfig;
  private token: GoogleAuthToken | null = null;

  constructor(config: GoogleAuthConfig) {
    this.config = config;
  }

  async signIn(): Promise<GoogleAuthToken> {
    if (!this.config.clientId) {
      throw new StorageError(
        'Google clientId is required.',
        StorageErrorCode.AUTH_REQUIRED,
        'google-drive',
      );
    }

    const token = {
      accessToken: `google_mock_${Date.now().toString(36)}`,
      expiresAt: Date.now() + 60 * 60 * 1000,
    };
    this.token = token;
    return token;
  }

  async refreshToken(): Promise<GoogleAuthToken> {
    if (!this.token) {
      throw new StorageError(
        'No active Google session.',
        StorageErrorCode.AUTH_REQUIRED,
        'google-drive',
      );
    }
    this.token = {
      ...this.token,
      expiresAt: Date.now() + 60 * 60 * 1000,
    };
    return this.token;
  }

  async signOut(): Promise<void> {
    this.token = null;
  }

  isAuthenticated(): boolean {
    return this.token !== null && this.token.expiresAt > Date.now();
  }

  getAccessToken(): string | null {
    if (!this.isAuthenticated()) {
      return null;
    }
    return this.token?.accessToken ?? null;
  }
}
