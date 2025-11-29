"use server";

import api from "@/lib/api";
import { z } from "zod";
import { isAxiosError } from "axios";
import { cookies } from "next/headers";

const registerSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(3),
  password: z.string().min(6),
});

const requestOtpSchema = z.object({
  email: z.string().email(),
});

const loginSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export async function register(prevState: unknown, formData: FormData) {
  const validatedFields = registerSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
    };
  }
  try {
    const { data } = await api.post("/auth/register", validatedFields.data);
    console.log("Registration successful:", data);
    return data;
  } catch (error) {
    const errorMessage =
      isAxiosError(error) && error.response?.data?.message
        ? (error.response.data.message as string)
        : "An error occurred";
    return {
      error: errorMessage,
    };
  }
}

export async function requestOtp(prevState: unknown, formData: FormData) {
  const validatedFields = requestOtpSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
    };
  }

  try {
    const { data } = await api.post("/auth/otp/request", validatedFields.data);
    return data;
  } catch (error) {
    const errorMessage =
      isAxiosError(error) && error.response?.data?.message
        ? (error.response.data.message as string)
        : "An error occurred";
    return {
      error: errorMessage,
    };
  }
}

export async function login(prevState: unknown, formData: FormData) {
  const validatedFields = loginSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
    };
  }

  try {
    const { data } = await api.post("/auth/login", validatedFields.data);

    return data;
  } catch (error) {
    const errorMessage =
      isAxiosError(error) && error.response?.data?.message
        ? (error.response.data.message as string)
        : "An error occurred";

    return {
      error: errorMessage,
    };
  }
}

const passwordLoginSchema = z.object({
  email: z.string().email(),

  password: z.string().min(1), // Basic check, backend handles complexity
});

export async function loginWithPassword(
  prevState: unknown,
  formData: FormData
) {
  const validatedFields = passwordLoginSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      error: "Invalid fields. Please provide a valid email and password.",
    };
  }

  try {
    const { data } = await api.post(
      "/auth/login/password",
      validatedFields.data
    );
    console.log("Backend login response:", data);
    return data;
  } catch (error) {
    const errorMessage =
      isAxiosError(error) && error.response?.data?.message
        ? (error.response.data.message as string)
        : "An error occurred";

    return {
      error: errorMessage,
    };
  }
}

export async function refreshToken(token: string) {
  try {
    // We don't use the global api instance here to avoid interceptor recursion

    const { data } = await api.post("/auth/refresh", { refreshToken: token });
    return data;
  } catch (error) {
    const errorMessage =
      isAxiosError(error) && error.response?.data?.message
        ? (error.response.data.message as string)
        : "An error occurred";
    return {
      error: errorMessage,
    };
  }
}

export async function logoutUser(token: string) {
  try {
    await api.post("/auth/logout", { refreshToken: token });
    return { success: true };
  } catch (error) {
    // Fail silently, as the frontend will clear tokens regardless
    return { success: true };
  }
}
