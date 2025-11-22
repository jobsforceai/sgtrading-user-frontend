'use server';

import api from '@/lib/api';
import { cookies } from 'next/headers';
import { isAxiosError } from 'axios';
import { z } from 'zod';

const updateBotSchema = z.object({
    status: z.enum(['ACTIVE', 'PAUSED']).optional(),
    config: z.object({
        tradeAmount: z.coerce.number().min(1).optional(),
    }).optional(),
    insuranceEnabled: z.boolean().optional(),
    parameters: z.record(z.string(), z.any()).optional(),
    assets: z.array(z.string()).optional(),
});

export async function getBots() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken');

  if (!token) {
    return { error: 'Not authenticated' };
  }

  try {
    const { data } = await api.get('/bots', {
      headers: { Authorization: `Bearer ${token.value}` },
    });
    return { data };
  } catch (error) {
    const errorMessage = isAxiosError(error) && error.response?.data?.message
      ? (error.response.data.message as string)
      : 'An error occurred';
    return { error: errorMessage };
  }
}

export async function createBot(prevState: unknown, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const assets = formData.getAll('assets') as string[];
  
  const strategy = rawData.strategy as string;
  let parameters: any = {};

  if (strategy === 'RSI_STRATEGY') {
      parameters = { period: Number(rawData.period || 14) };
  } else if (strategy === 'MACD_STRATEGY') {
      parameters = {
          fastPeriod: Number(rawData.fastPeriod || 12),
          slowPeriod: Number(rawData.slowPeriod || 26),
          signalPeriod: Number(rawData.signalPeriod || 9),
      };
  } else if (strategy === 'SMA_CROSSOVER') {
      parameters = {
          fastPeriod: Number(rawData.fastPeriod || 10),
          slowPeriod: Number(rawData.slowPeriod || 50),
      };
  }

  // Construct nested config object manually because Object.fromEntries flattens it
  const payload = {
      name: rawData.name,
      strategy: strategy as any,
      assets,
      tradeAmount: rawData.tradeAmount,
      insuranceEnabled: rawData.insuranceEnabled === 'on', // Checkbox returns 'on'
      config: {
          expirySeconds: rawData.expirySeconds,
          maxConcurrentTrades: rawData.maxConcurrentTrades,
          stopLossAmount: rawData.stopLossAmount,
          takeProfitAmount: rawData.takeProfitAmount,
      },
      parameters,
  };

  console.log('Creating Bot Payload:', JSON.stringify(payload, null, 2));

  // Define Schema inline to prevent initialization issues
  const botConfigSchema = z.object({
    expirySeconds: z.coerce.number().min(5),
    maxConcurrentTrades: z.coerce.number().min(1).max(10),
    stopLossAmount: z.coerce.number().min(0),
    takeProfitAmount: z.coerce.number().min(0),
  });

  const createBotSchema = z.object({
    name: z.string().min(3),
    strategy: z.enum(['RANDOM_TEST', 'RSI_STRATEGY', 'MACD_STRATEGY', 'SMA_CROSSOVER']),
    assets: z.array(z.string()).min(1, "Select at least one asset"),
    tradeAmount: z.coerce.number().min(1),
    insuranceEnabled: z.boolean().optional(),
    config: botConfigSchema,
    parameters: z.record(z.string(), z.any()).optional(),
  });

  const validatedFields = createBotSchema.safeParse(payload);

  if (!validatedFields.success) {
    console.error('Validation Error:', validatedFields.error);
    return { error: 'Invalid fields' };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken');

  if (!token) {
    return { error: 'Not authenticated' };
  }

  try {
    const { data } = await api.post('/bots', validatedFields.data, {
      headers: { Authorization: `Bearer ${token.value}` },
    });
    return { data };
  } catch (error) {
    const errorMessage = isAxiosError(error) && error.response?.data?.message
      ? (error.response.data.message as string)
      : 'An error occurred';
    return { error: errorMessage };
  }
}

export async function updateBot(botId: string, payload: any) {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken');
  
    if (!token) {
      return { error: 'Not authenticated' };
    }
  
    try {
      const { data } = await api.patch(`/bots/${botId}`, payload, {
        headers: { Authorization: `Bearer ${token.value}` },
      });
      return { data };
    } catch (error) {
      const errorMessage = isAxiosError(error) && error.response?.data?.message
        ? (error.response.data.message as string)
        : 'An error occurred';
      return { error: errorMessage };
    }
}

export async function getBotDefinitions() {
    try {
        const { data } = await api.get('/bots/definitions');
        return { data };
    } catch (error) {
        // Fallback definitions if endpoint fails (optional, but good for UX)
        return { 
            data: {
                tradeAmount: "The amount of money (USD) invested in each individual trade.",
                expirySeconds: "The duration of each trade in seconds.",
                maxConcurrentTrades: "Maximum number of open trades allowed at one time.",
                stopLossAmount: "Bot stops if Net Loss reaches this amount.",
                takeProfitAmount: "Bot stops if Net Profit reaches this amount.",
                insuranceEnabled: "If enabled, losing trades are fully refunded.",
                strategy: "The algorithm used to determine trade entry points.",
                assets: "The financial instruments the bot will monitor and trade.",
                period: "Sensitivity period. Lower values make it more reactive.",
                fastPeriod: "Short-term moving average lookback period.",
                slowPeriod: "Long-term moving average lookback period.",
                signalPeriod: "Smoothing period for the signal line."
            }
        };
    }
}

export async function archiveBot(botId: string) {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken');
  
    if (!token) {
      return { error: 'Not authenticated' };
    }
  
    try {
      await api.delete(`/bots/${botId}`, {
        headers: { Authorization: `Bearer ${token.value}` },
      });
      return { success: true };
    } catch (error) {
      const errorMessage = isAxiosError(error) && error.response?.data?.message
        ? (error.response.data.message as string)
        : 'An error occurred';
      return { error: errorMessage };
    }
}
