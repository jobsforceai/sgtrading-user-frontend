'use server';

import api from '@/lib/api';
import { isAxiosError } from 'axios';

export async function getInstruments() {
  try {
    const { data } = await api.get('/markets/instruments');
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