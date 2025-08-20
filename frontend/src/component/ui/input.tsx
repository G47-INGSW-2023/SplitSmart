'use client';

import { ComponentProps } from 'react';

export type InputProps = ComponentProps<'input'>;

export const Input = ({ className, ...props }: InputProps) => {
  return (
    <input
      className={`w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      {...props}
    />
  );
};