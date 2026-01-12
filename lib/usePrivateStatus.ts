'use client';

import { useEffect, useState } from 'react';
import { apiJson } from './api';

type PrivateState = { isPrivate: boolean; payer?: string };

export function usePrivateStatus(modelUsername: string) {
  const [state, setState] = useState<PrivateState>({ isPrivate: false });

  const refresh = () => {
    apiJson(`/api/private/status?modelUsername=${encodeURIComponent(modelUsername)}`)
      .then((data) => setState(data as PrivateState))
      .catch(console.error);
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [modelUsername]);

  return { state, refresh };
}

