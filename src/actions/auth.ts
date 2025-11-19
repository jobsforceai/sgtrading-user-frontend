'use server';

import api from '@/lib/api';
import { z } from 'zod';
import { isAxiosError } from 'axios';

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
  const validatedFields = registerSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      error: 'Invalid fields',
    };
  }
  try {
    const { data } = await api.post('/auth/register', validatedFields.data);
    console.log('Registration successful:', data);
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

export async function requestOtp(prevState: unknown, formData: FormData) {
  const validatedFields = requestOtpSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      error: 'Invalid fields',
    };
  }

  try {
    const { data } = await api.post('/auth/otp/request', validatedFields.data);
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

export async function login(prevState: unknown, formData: FormData) {
  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      error: 'Invalid fields',
    };
  }

  try {
    const { data } = await api.post('/auth/login', validatedFields.data);
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