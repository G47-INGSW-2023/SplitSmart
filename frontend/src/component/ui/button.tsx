'use client';

import { ComponentProps } from 'react';

// Uniamo le props standard di un bottone HTML con le nostre
export interface ButtonProps extends ComponentProps<'button'> {}

export const Button = ({ className, children, ...props }: ButtonProps) => {
  return (
    <button
      className={`w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};