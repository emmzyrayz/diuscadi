"use client";
import React, { useState } from "react";
import { IconType } from "react-icons";
import { LuEye, LuEyeOff } from "react-icons/lu";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: IconType;
  error?: string;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  icon: Icon,
  error,
  type,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-1.5 w-full">
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
          <Icon className="w-4 h-4" />
        </div>

        <input
          {...props}
          type={isPassword && showPassword ? "text" : type}
          placeholder={label}
          className={`w-full bg-muted border ${
            error ? "border-rose-500" : "border-border"
          } rounded-2xl py-4 pl-12 pr-12 text-xs font-bold text-foreground placeholder:text-muted-foreground placeholder:uppercase placeholder:tracking-widest focus:bg-background focus:border-foreground focus:ring-0 transition-all outline-none`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? (
              <LuEyeOff className="w-4 h-4" />
            ) : (
              <LuEye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest pl-4">
          {error}
        </p>
      )}
    </div>
  );
};
