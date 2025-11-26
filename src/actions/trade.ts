"use server";

import api from "@/lib/api";
import { cookies } from "next/headers";
import { z } from "zod";
import { isAxiosError } from "axios";

const createTradeSchema = z.object({
  symbol: z.string(),
  direction: z.enum(["UP", "DOWN"]),
  stakeUsd: z.coerce.number().min(1),
  expirySeconds: z.coerce.number().min(10),
  mode: z.enum(["LIVE", "DEMO"]).default("DEMO"),
});

export async function getQuote(symbol: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken");

  if (!token) {
    return { error: "Not authenticated" };
  }

  try {
    const { data } = await api.get(`/markets/quotes?symbol=${symbol}`, {
      headers: { Authorization: `Bearer ${token.value}` },
    });
    return {
      data,
    };
  } catch (error) {
    const errorMessage = isAxiosError(error) && error.response?.data?.message
      ? (error.response.data.message as string)
      : "An error occurred";
    return {
      error: errorMessage,
    };
  }
}

export async function createTrade(prevState: unknown, formData: FormData) {
  const validatedFields = createTradeSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
    };
  }
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken");

  if (!token) {
    return {
      error: "Not authenticated",
    };
  }

  try {
    const { data } = await api.post("/trades", validatedFields.data, {
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
      : "An error occurred";
    return {
      error: errorMessage,
    };
  }
}

export async function getOpenTrades() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken");

  if (!token) {
    return {
      error: "Not authenticated",
    };
  }

  try {
    const { data } = await api.get("/trades/open", {
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
      : "An error occurred";
    return {
      error: errorMessage,
    };
  }
}

export async function getTradeHistory(mode?: string, page: number = 1, limit: number = 10) {
  const cookieStore = await cookies();

  const token = cookieStore.get("accessToken");

  if (!token) {
    return {
      error: "Not authenticated",
    };
  }

  try {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });
    if (mode) {
        params.append('mode', mode);
    }
    
    const url = `/trades/history?${params.toString()}`;
    const { data } = await api.get(url, {
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
      : "An error occurred";
    return {
      error: errorMessage,
    };
  }
}

export async function getHistoricalData(
  symbol: string,
  resolution: string,
  from: number,
  to: number
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken");

  if (!token) {
    return { error: "Not authenticated" };
  }

  try {
    const { data } = await api.get(
      `/markets/candles?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}`,
      {
        headers: { Authorization: `Bearer ${token.value}` },
      }
    );

    return {
      data,
    };
  } catch (error) {
    const errorMessage = isAxiosError(error) && error.response?.data?.message
      ? (error.response.data.message as string)
      : "An error occurred";
    return {
      error: errorMessage,
    };
  }
}