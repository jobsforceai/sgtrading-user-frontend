'use server';

import api from '@/lib/api';
import { isAxiosError } from 'axios';
import { cookies } from 'next/headers';

export async function getInstruments() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken');

  if (!token) {
    return { error: 'Not authenticated' };
  }

  try {
    const { data } = await api.get('/markets/instruments', {
      headers: { Authorization: `Bearer ${token.value}` },
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