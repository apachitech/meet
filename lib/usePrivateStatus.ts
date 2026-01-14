'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiJson } from './api';

type PrivateState = { isPrivate: boolean; payer?: string };

export function usePrivateStatus(modelUsername: string) {
  const [state, setState] = useState<PrivateState>({ isPrivate: false });

  const refresh = useCallback(() => {
    apiJson(`/api/private/status?modelUsername=${encodeURIComponent(modelUsername)}`)
      .then((data) => setState(data as PrivateState))
      .catch(console.error);
  }, [modelUsername]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [refresh]);

  return { state, refresh };
}

