'use server';

import api from '@/lib/api';
import { cookies } from 'next/headers';
import { isAxiosError } from 'axios';
import { User } from '@/store/user';

export async function getProfile(): Promise<User | { error: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken');

  if (!token) {
    return {
      error: 'Not authenticated',
    };
  }

  try {
    const { data } = await api.get<User>('/users/me', {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });
    return data;
  } catch (error) {
    const errorMessage = isAxiosError(error) && error.response?.data?.message
      ? (error.response.data.message as string)
      : 'An error occurred';
    return {
      error: errorMessage,
    };
  }
}

export async function getWallet(token?: string) {
  let authToken = token;

  if (!authToken) {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('accessToken');
    if (tokenCookie) {
      authToken = tokenCookie.value;
    }
  }

  if (!authToken) {
    return {
      error: 'Not authenticated',
    };
  }

  try {
    const { data } = await api.get('/wallets/me', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    return data;
  } catch (error) {
    const errorMessage = isAxiosError(error) && error.response?.data?.message
      ? (error.response.data.message as string)
      : 'An error occurred';
    return {
      error: errorMessage,
    };
  }
}