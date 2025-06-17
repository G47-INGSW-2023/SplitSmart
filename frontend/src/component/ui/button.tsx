'use client';

import * as React from 'react';
// 1. Importiamo le funzioni necessarie da CVA
import { cva, type VariantProps } from 'class-variance-authority';

// 2. Definiamo le varianti di stile usando cva()
const buttonVariants = cva(
  // Stili di base che si applicano a TUTTE le varianti
  'w-full font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      // Definiamo la nostra prima categoria di varianti: "variant"
      variant: {
        // La variante "default" (o "primary") avrà il tuo stile originale
        default: 'bg-blue-600 text-white hover:bg-blue-700',
        
        // Aggiungiamo la variante "secondary" che ti serve in CreateGroupModal
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        
        // Aggiungiamo una variante "destructive" per azioni pericolose (es. cancellare)
        destructive: 'bg-red-600 text-white hover:bg-red-700',
      },
      // Potremmo aggiungere altre categorie qui, come "size"
      size: {
        default: 'py-2 px-4',
        small: 'py-1 px-2 text-sm',
      }
    },
    // Valori di default se non vengono specificati
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// 3. Aggiorniamo l'interfaccia delle props
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    // Aggiungiamo i tipi generati da CVA alla nostra interfaccia
    VariantProps<typeof buttonVariants> {}

// 4. Aggiorniamo il componente per usare le varianti
// Usiamo React.forwardRef per una migliore integrazione con altre librerie
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  // Estraggo le nostre nuove props `variant` e `size`
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <button
        // Applichiamo dinamicamente le classi corrette usando la funzione buttonVariants()
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button'; // Utile per il debugging in React DevTools

// 5. Esportiamo il componente per poterlo usare
export { Button };