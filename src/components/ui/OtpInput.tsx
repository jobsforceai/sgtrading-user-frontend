'use client';

import React, { useState, useRef, ChangeEvent, KeyboardEvent, ClipboardEvent } from 'react';

interface OtpInputProps {
  length?: number;
  onChange?: (otp: string) => void;
  hasError?: boolean;
}

const OtpInput: React.FC<OtpInputProps> = ({ length = 6, onChange, hasError }) => {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (/^[0-9]$/.test(value) || value === '') {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      onChange?.(newOtp.join(''));

      if (value !== '' && index < length - 1) {
        inputsRef.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (otp[index] !== '') {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
        onChange?.(newOtp.join(''));
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, length - index);
    if (/^[0-9]+$/.test(pasteData)) {
      const newOtp = [...otp];
      for (let i = 0; i < pasteData.length; i++) {
        newOtp[index + i] = pasteData[i];
      }
      setOtp(newOtp);
      onChange?.(newOtp.join(''));
      inputsRef.current[index + pasteData.length - 1]?.focus();
    }
  };

  const shakeClass = hasError ? 'animate-shake' : '';

  return (
    <div className={`flex justify-center space-x-2 ${shakeClass}`}>
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            if (el) inputsRef.current[index] = el;
          }}
          type="text"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={(e) => handlePaste(e, index)}
          className="w-12 h-12 text-center text-2xl font-bold bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-lg text-white"
        />
      ))}
    </div>
  );
};

export default OtpInput;
