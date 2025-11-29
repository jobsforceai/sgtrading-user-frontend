'use server';

import api from '@/lib/api';
import { cookies } from 'next/headers';
import { isAxiosError } from 'axios';
import { z } from 'zod';

// Action to get all vaults
export async function getVaults() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken');

  // Vaults can be public, but let's send auth if available
  try {
    const { data } = await api.get('/vaults', {
      headers: token ? { Authorization: `Bearer ${token.value}` } : {},
    });
    return data;
  } catch (error) {
    const errorMessage = isAxiosError(error) && error.response?.data?.message
      ? (error.response.data.message as string)
      : 'An error occurred while fetching vaults';
    return { error: errorMessage };
  }
}

// Action to get a single vault's details
export async function getVault(vaultId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken');

  try {
    const { data } = await api.get(`/vaults/${vaultId}`, {
      headers: token ? { Authorization: `Bearer ${token.value}` } : {},
    });
    return data;
  } catch (error) {
    const errorMessage = isAxiosError(error) && error.response?.data?.message
      ? (error.response.data.message as string)
      : 'An error occurred while fetching vault details';
    return { error: errorMessage };
  }
}

// Action for a user to deposit into a vault
export async function depositToVault(vaultId: string, prevState: unknown, formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken');

  if (!token) {
    return { error: 'Not authenticated' };
  }

  const schema = z.object({
    amountUsd: z.coerce.number().min(1),
    buyInsurance: z.preprocess((val) => val === 'on' || val === 'true' || val === true, z.boolean()),
  });
  
  const validatedFields = schema.safeParse(Object.fromEntries(formData.entries()));
  
  if (!validatedFields.success) {
      return { error: 'Invalid deposit amount or insurance flag.' };
  }

  try {
    const { data } = await api.post(`/vaults/${vaultId}/deposit`, validatedFields.data, {
      headers: { Authorization: `Bearer ${token.value}` },
    });
    return data;
  } catch (error) {
    const errorMessage = isAxiosError(error) && error.response?.data?.message
      ? (error.response.data.message as string)
      : 'Failed to deposit into vault';
    return { error: errorMessage };
  }
}

// Action for a creator to activate a vault
export async function activateVault(vaultId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken');

  if (!token) {
    return { error: 'Not authenticated' };
  }

  try {
    const { data } = await api.post(`/vaults/${vaultId}/activate`, {}, {
      headers: { Authorization: `Bearer ${token.value}` },
    });
    return data;
  } catch (error) {
    const errorMessage = isAxiosError(error) && error.response?.data?.message
      ? (error.response.data.message as string)
      : 'Failed to activate vault';
    return { error: errorMessage };
  }
}


// Action for a creator to create a vault
export async function createVault(prevState: unknown, formData: FormData) {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken');

    if (!token) {
        return { error: 'Not authenticated' };
    }

    const schema = z.object({
        name: z.string().min(3),
        botId: z.string().min(1),
        targetAmountUsd: z.coerce.number().min(1),
        durationDays: z.coerce.number().min(1),
        creatorCollateralPercent: z.coerce.number().min(0).max(100),
        profitSharePercent: z.coerce.number().min(0).max(100),
    });

    const validatedFields = schema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        console.error('Vault Creation Validation Error:', validatedFields.error.flatten().fieldErrors);
        return { error: 'Invalid fields. Please check your inputs.' };
    }

    try {
        const { data } = await api.post('/vaults', validatedFields.data, {
            headers: { Authorization: `Bearer ${token.value}` },
        });
        return data;
    } catch (error) {
            const errorMessage = isAxiosError(error) && error.response?.data?.message
              ? (error.response.data.message as string)
              : 'An error occurred while creating the vault';
            return { error: errorMessage };
          }
        }
        
        // Action for a user to withdraw their funds from a vault (if eligible)
        export async function withdrawFromVault(vaultId: string) {
          const cookieStore = await cookies();
          const token = cookieStore.get('accessToken');
        
          if (!token) {
            return { error: 'Not authenticated' };
          }
        
          try {
            const { data } = await api.post(`/vaults/${vaultId}/withdraw`, {}, {
              headers: { Authorization: `Bearer ${token.value}` },
            });
            return data;
          } catch (error) {
            const errorMessage = isAxiosError(error) && error.response?.data?.message
              ? (error.response.data.message as string)
              : 'Failed to withdraw from vault';
            return { error: errorMessage };
          }
        }
        
        // Action to get all vaults a user is participating in
        export async function getMyVaultParticipations() {
          const cookieStore = await cookies();
          const token = cookieStore.get('accessToken');
          if (!token) {
    return { error: 'Not authenticated' };
  }

  try {
    const { data } = await api.get('/vaults/me/participations', {
      headers: { Authorization: `Bearer ${token.value}` },
    });
    return data;
  } catch (error) {
    const errorMessage = isAxiosError(error) && error.response?.data?.message
      ? (error.response.data.message as string)
      : 'An error occurred while fetching your vault participations';
    return { error: errorMessage };
  }
}
