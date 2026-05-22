import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../utils/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'SELLER' | 'ADMIN';
  avatar?: string;
  storeName?: string;
  businessType?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  sellerLogin: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (userData: Omit<User, 'id'> & { password: string }) => Promise<{ success: boolean; message?: string; data?: any }>;
  sellerRegister: (userData: Omit<User, 'id'> & { password: string }) => Promise<{ success: boolean; message?: string; data?: any }>;
  verifyOTP: (email: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  verifySellerOTP: (email: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  resendOTP: (email: string) => Promise<{ success: boolean; message?: string }>;
  resendSellerOTP: (email: string) => Promise<{ success: boolean; message?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => void;
  initializeAuth: () => void;
  setAuth: (user: User, token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,

      sellerLogin: async (email: string, password: string) => {
        try {
          const response = await api.sellerLogin(email, password);

          if (response.success && response.data) {
            const { user, token } = response.data;

            set({
              user,
              token,
              isAuthenticated: true
            });

            // Store token in localStorage for API calls
            localStorage.setItem('token', token);
            return { success: true };
          }

          console.error('Seller login failed:', response.message);
          return {
            success: false,
            message: response.message || 'Invalid email or password'
          };
        } catch (error) {
          console.error('Seller login error:', error);
          return {
            success: false,
            message: 'Login failed. Please check your connection and try again.'
          };
        }
      },

      login: async (email: string, password: string) => {
        try {
          const response = await api.login(email, password);

          if (response.success && response.data) {
            const { user, token } = response.data;

            set({
              user,
              token,
              isAuthenticated: true
            });

            // Store token in localStorage for API calls
            localStorage.setItem('token', token);
            return { success: true };
          }

          console.error('Login failed:', response.message);
          return {
            success: false,
            message: response.message || 'Invalid email or password'
          };
        } catch (error) {
          console.error('Login error:', error);
          return {
            success: false,
            message: 'Login failed. Please check your connection and try again.'
          };
        }
      },

      sellerRegister: async (userData) => {
        try {
          const response = await api.sellerRegister(userData);

          if (response.success) {
            return { 
              success: true, 
              message: response.message,
              data: response.data 
            };
          }

          console.error('Seller registration failed:', response.message);
          return {
            success: false,
            message: response.message || 'Registration failed. Please try again.'
          };
        } catch (error) {
          console.error('Seller registration error:', error);
          return {
            success: false,
            message: 'Registration failed. Please check your connection and try again.'
          };
        }
      },

      register: async (userData) => {
        try {
          const response = await api.register(userData);

          if (response.success) {
            // Return success with data for OTP verification
            return { 
              success: true, 
              message: response.message,
              data: response.data 
            };
          }

          console.error('Registration failed:', response.message);
          return {
            success: false,
            message: response.message || 'Registration failed. Please try again.'
          };
        } catch (error) {
          console.error('Registration error:', error);
          return {
            success: false,
            message: 'Registration failed. Please check your connection and try again.'
          };
        }
      },

      verifyOTP: async (email: string, otp: string) => {
        try {
          const response = await api.verifyOTP(email, otp);

          if (response.success && response.data) {
            const { user, token } = response.data;

            set({
              user,
              token,
              isAuthenticated: true
            });

            localStorage.setItem('token', token);
            return { success: true, message: response.message };
          }

          return {
            success: false,
            message: response.message || 'OTP verification failed'
          };
        } catch (error) {
          console.error('OTP verification error:', error);
          return {
            success: false,
            message: 'Verification failed. Please try again.'
          };
        }
      },

      verifySellerOTP: async (email: string, otp: string) => {
        try {
          const response = await api.verifySellerOTP(email, otp);

          if (response.success && response.data) {
            const { user, token } = response.data;

            set({
              user,
              token,
              isAuthenticated: true
            });

            localStorage.setItem('token', token);
            return { success: true, message: response.message };
          }

          return {
            success: false,
            message: response.message || 'OTP verification failed'
          };
        } catch (error) {
          console.error('Seller OTP verification error:', error);
          return {
            success: false,
            message: 'Verification failed. Please try again.'
          };
        }
      },

      resendOTP: async (email: string) => {
        try {
          const response = await api.resendOTP(email);
          return { 
            success: response.success, 
            message: response.message 
          };
        } catch (error) {
          return { 
            success: false, 
            message: 'Failed to resend OTP. Please try again.' 
          };
        }
      },

      resendSellerOTP: async (email: string) => {
        try {
          const response = await api.resendSellerOTP(email);
          return { 
            success: response.success, 
            message: response.message 
          };
        } catch (error) {
          return { 
            success: false, 
            message: 'Failed to resend OTP. Please try again.' 
          };
        }
      },

      forgotPassword: async (email) => {
        try {
          const response = await api.forgotPassword(email);
          return { success: response.success, message: response.message };
        } catch (error) {
          return { success: false, message: 'An error occurred.' };
        }
      },

      resetPassword: async (token, password) => {
        try {
          const response = await api.resetPassword(token, password);
          return { success: response.success, message: response.message };
        } catch (error) {
          return { success: false, message: 'An error occurred.' };
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateProfile: (userData) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },

      initializeAuth: async () => {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const response = await api.getCurrentUser();
            if (response.success && response.data) {
              set({
                user: response.data,
                isAuthenticated: true,
                token
              });
            } else {
              // Token is invalid or expired, clear it
              localStorage.removeItem('token');
              set({
                user: null,
                isAuthenticated: false,
                token: null
              });
            }
          } catch (error) {
            console.warn('Auth initialization failed (this is normal if server is not running):', error.message);
            // Clear auth state on error but don't throw
            localStorage.removeItem('token');
            set({
              user: null,
              isAuthenticated: false,
              token: null
            });
          }
        } else {
          // No token, set default state
          set({
            user: null,
            isAuthenticated: false,
            token: null
          });
        }
      },

      setAuth: (user: User, token: string) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);
