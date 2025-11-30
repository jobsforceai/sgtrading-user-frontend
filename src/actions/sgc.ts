'use server';

import { getWallet } from './user';
import api from '@/lib/api';
import { z } from 'zod';
import { isAxiosError } from 'axios';
import { cookies } from 'next/headers';

const redeemSgcCodeSchema = z.object({
  code: z.string().min(1, { message: 'Redemption code is required' }),
});

export async function redeemSgcCode(prevState: unknown, formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken');

  if (!token) {
    return { error: 'Authentication token required' };
  }

  const validatedFields = redeemSgcCodeSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      error: 'Invalid fields',
    };
  }

  try {
    const { data } = await api.post('/redeem', validatedFields.data, {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });
    return {
      data,
    };
  } catch (error) {
    console.error('SGC Redemption Error:', JSON.stringify(error, null, 2));
    const errorMessage =
      isAxiosError(error) && error.response?.data?.message
        ? (error.response.data.message as string)
        : 'An error occurred';
    
    console.error('Parsed Error Message:', errorMessage);
    return {
      error: errorMessage,
    };
  }
}

const createSgcWithdrawalCodeSchema = z.object({
  amountUsd: z.coerce.number().min(1, { message: 'Withdrawal amount must be at least $1' }),
});

export async function createSgcWithdrawalCode(prevState: unknown, formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken');

  if (!token) {
    return { error: 'Authentication token required' };
  }

  const validatedFields = createSgcWithdrawalCodeSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      error: 'Invalid withdrawal amount.',
    };
  }

  const walletData = await getWallet(token.value);
  if (walletData.error) {
    return { error: "Could not retrieve wallet information." };
  }

  if (validatedFields.data.amountUsd > walletData.liveBalanceUsd) {
    return { error: "Insufficient live balance." };
  }

  try {
    const { data } = await api.post('/sgc-offramp/create-code', validatedFields.data, {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });
    return {
      data,
    };
  } catch (error) {
    console.error('SGC Withdrawal Error:', JSON.stringify(error, null, 2));
    const errorMessage =
      isAxiosError(error) && error.response?.data?.message
        ? (error.response.data.message as string)
        : 'An error occurred';
    
    return {
      error: errorMessage,
    };
  }
}