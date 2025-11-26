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
  const clonedFrom = rawData.clonedFrom as string | undefined;

  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken');

  if (!token) {
    return { error: 'Not authenticated' };
  }

  let validatedFields;

  if (clonedFrom) {
    // Logic for cloning a bot, per final documentation
    const cloneBotSchema = z.object({
      name: z.string().min(3),
      clonedFrom: z.string(),
      config: z.object({
        tradeAmount: z.coerce.number().min(1),
        expirySeconds: z.coerce.number().min(5),
      }),
    });
    
    const payload = {
        name: rawData.name,
        clonedFrom: clonedFrom,
        config: {
            tradeAmount: rawData.tradeAmount,
            expirySeconds: rawData.expirySeconds,
        }
    };
    
    validatedFields = cloneBotSchema.safeParse(payload);

    if (!validatedFields.success) {
      console.error('Clone Validation Error:', validatedFields.error.flatten().fieldErrors);
      return { error: 'Invalid fields for cloning. Please check your inputs.' };
    }
  } else {
    // Logic for creating a new personal bot, per final documentation
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

    const botConfigSchema = z.object({
        tradeAmount: z.coerce.number().min(1),
        expirySeconds: z.coerce.number().min(10),
        maxConcurrentTrades: z.coerce.number().min(1).max(10).optional(),
        stopLossAmount: z.coerce.number().min(0).optional(),
        takeProfitAmount: z.coerce.number().min(0).optional(),
    });

    const createBotSchema = z.object({
        name: z.string().min(3),
        visibility: z.enum(['PUBLIC', 'PRIVATE']),
        strategy: z.enum(['RANDOM_TEST', 'RSI_STRATEGY', 'MACD_STRATEGY', 'SMA_CROSSOVER']),
        assets: z.array(z.string()).min(1, "Select at least one asset"),
        profitSharePercent: z.coerce.number().min(0).max(100).optional(),
        config: botConfigSchema,
        parameters: z.record(z.string(), z.any()).optional(),
    });
    
    const payload = {
        name: rawData.name,
        visibility: rawData.visibility,
        strategy: strategy as any,
        assets,
        profitSharePercent: rawData.visibility === 'PUBLIC' ? Number(rawData.profitSharePercent) : undefined,
        config: {
            tradeAmount: rawData.tradeAmount,
            expirySeconds: rawData.expirySeconds,
            maxConcurrentTrades: rawData.maxConcurrentTrades,
            stopLossAmount: rawData.stopLossAmount,
            takeProfitAmount: rawData.takeProfitAmount,
        },
        parameters,
    };

    validatedFields = createBotSchema.safeParse(payload);

    if (!validatedFields.success) {
      console.error('Validation Error:', validatedFields.error.flatten().fieldErrors);
      return { error: 'Invalid fields. Please check your inputs.' };
    }
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

export async function getPublicBots() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken');
  try {
    const { data } = await api.get('/bots/public', {
      headers: token ? { Authorization: `Bearer ${token.value}` } : {},
  });
    console.log('API response from /bots/public:', data);
    return { data };
  } catch (error) {
    const errorMessage = isAxiosError(error) && error.response?.data?.message
      ? (error.response.data.message as string)
      : 'An error occurred while fetching public bots';
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
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken');

    try {
        const { data } = await api.get('/bots/definitions', {
            headers: token ? { Authorization: `Bearer ${token.value}` } : {},
        });
        return { data };
    } catch (error) {
        console.error("Failed to fetch bot definitions, returning fallback. Error:", error);
        // Fallback definitions if endpoint fails, matching the expected structure
        return { 
            data: {
                strategies: [
                    { id: 'RANDOM_TEST', name: 'Random Tester', description: 'Randomly trades for testing purposes.' },
                    { id: 'RSI_STRATEGY', name: 'RSI Strategy', description: 'Trades on RSI overbought/oversold signals.' },
                    { id: 'MACD_STRATEGY', name: 'MACD Crossover', description: 'Trades on MACD line crossovers.' },
                    { id: 'SMA_CROSSOVER', name: 'SMA Crossover', description: 'Trades on simple moving average crossovers.' }
                ],
                parameters: {
                    tradeAmount: "The amount of money (USD) invested in each individual trade.",
                    expirySeconds: "The duration of each trade in seconds.",
                    maxConcurrentTrades: "Maximum number of open trades allowed at one time.",
                    stopLossAmount: "Bot stops if Net Loss reaches this amount.",
                    takeProfitAmount: "Bot stops if Net Profit reaches this amount.",
                    insuranceEnabled: "If enabled, losing trades are fully refunded.",
                    assets: "The financial instruments the bot will monitor and trade.",
                    period: "Sensitivity period. Lower values are more reactive.",
                    fastPeriod: "Short-term moving average lookback period.",
                    slowPeriod: "Long-term moving average lookback period.",
                    signalPeriod: "Smoothing period for the signal line."
                }
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
