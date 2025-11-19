'use server';

import api from '@/lib/api';
import { cookies } from 'next/headers';
import { isAxiosError } from 'axios';

export async function getProfile() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken');

  if (!token) {
    return {
      error: 'Not authenticated',
    };
  }

  try {
    const { data } = await api.get('/users/me', {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });
    return {
      data,
    };
  } catch (error) {
    const errorMessage = isAxiosError(error) && error.response?.data?.message
      ? (error.response.data.message as string)
      : 'An error occurred';
    return {
      error: errorMessage,
    };
  }
}

export async function getWallet() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken');

  if (!token) {
    return {
      error: 'Not authenticated',
    };
  }

  try {
    const { data } = await api.get('/wallets/me', {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });
    return {
      data,
    };
  } catch (error) {
    const errorMessage = isAxiosError(error) && error.response?.data?.message
      ? (error.response.data.message as string)
      : 'An error occurred';
    return {
      error: errorMessage,
    };
  }
}