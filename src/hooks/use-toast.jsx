import * as React from 'react';
import { toast } from '@/components/ui/use-toast-provider'; // or your toast provider path

export function useToast() {
  return React.useCallback((options) => {
    toast(options);
  }, []);
}
