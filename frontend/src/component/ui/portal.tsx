'use client';

import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: ReactNode;
}

export const Portal = ({ children }: PortalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Quando il componente viene smontato, rimettiamo `mounted` a false
    return () => setMounted(false);
  }, []);

  // Creiamo il portale solo dopo che il componente è stato montato sul client.
  // Questo evita errori di "mismatch" tra server e client in Next.js.
  // Il portale renderizzerà i figli (`children`) direttamente nel `document.body`.
  return mounted ? createPortal(children, document.body) : null;
};