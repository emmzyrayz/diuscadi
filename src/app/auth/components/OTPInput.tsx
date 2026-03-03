"use client";
import React, { useRef, KeyboardEvent, ClipboardEvent } from "react";
import { cn } from "../../../lib/utils";

interface OtpInputProps {
  length?: number;
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * Accessible OTP digit-box input.
 * - Paste support: pasting "123456" fills all boxes at once
 * - Backspace on an empty box moves focus to the previous box
 * - Arrow keys navigate between boxes
 */
export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  error,
  disabled,
}) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const focusAt = (index: number) => {
    refs.current[index]?.focus();
  };

  const handleChange = (index: number, char: string) => {
    // Accept only single digits
    const digit = char.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[index] = digit;
    onChange(next);
    if (digit && index < length - 1) focusAt(index + 1);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (value[index]) {
        const next = [...value];
        next[index] = "";
        onChange(next);
      } else if (index > 0) {
        focusAt(index - 1);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      focusAt(index - 1);
    } else if (e.key === "ArrowRight" && index < length - 1) {
      focusAt(index + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    const next = Array(length).fill("");
    pasted.split("").forEach((char, i) => {
      next[i] = char;
    });
    onChange(next);
    // Focus last filled box or the next empty one
    const lastFilled = Math.min(pasted.length, length - 1);
    focusAt(lastFilled);
  };

  return (
    <div className={cn('flex', 'flex-col', 'items-center', 'gap-3', 'w-full')}>
      <div className={cn('flex', 'items-center', 'justify-center', 'gap-2', 'w-full')}>
        {Array.from({ length }).map((_, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[i] ?? ""}
            disabled={disabled}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={`
              w-11 h-14 text-center text-lg font-black text-slate-900 rounded-2xl border
              bg-slate-50 focus:bg-white focus:ring-0 outline-none transition-all
              ${error ? "border-rose-400" : value[i] ? "border-slate-900" : "border-slate-100"}
              focus:border-slate-900 disabled:opacity-40 disabled:cursor-not-allowed
              caret-transparent
            `}
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>
      {error && (
        <p className={cn('text-[9px]', 'font-black', 'text-rose-500', 'uppercase', 'tracking-widest', 'text-center')}>
          {error}
        </p>
      )}
    </div>
  );
};
