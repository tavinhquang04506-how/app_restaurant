import { authStorage } from './authStorage';
import { restaurantApi } from './restaurantApi';

let refreshPromise: Promise<string> | null = null;

export const tokenRefresher = {
  async refreshAccessToken(): Promise<string> {
    if (refreshPromise) {
      return refreshPromise;
    }
    const tokens = authStorage.getTokens();
    if (!tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }
    refreshPromise = restaurantApi
      .refresh(tokens.refreshToken)
      .then((res) => {
        const updated = { accessToken: res.accessToken, refreshToken: tokens.refreshToken };
        authStorage.setTokens(updated);
        return res.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
    return refreshPromise;
  },
};

