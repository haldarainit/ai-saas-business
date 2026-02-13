'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { expoUrlAtom } from '@/lib/stores/qrCodeStore';

interface ExpoQrModalProps {
  open: boolean;
  onClose: () => void;
}

export function ExpoQrModal({ open, onClose }: ExpoQrModalProps) {
  const expoUrl = useStore(expoUrlAtom);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    let mounted = true;

    async function generate() {
      if (!expoUrl) {
        setQrDataUrl('');
        return;
      }

      try {
        const QRCode = (await import('qrcode')).default;
        const dataUrl = await QRCode.toDataURL(expoUrl, { margin: 1, width: 220 });
        if (mounted) setQrDataUrl(dataUrl);
      } catch (error) {
        console.error('Failed to generate QR code:', error);
        if (mounted) setQrDataUrl('');
      }
    }

    generate();

    return () => {
      mounted = false;
    };
  }, [expoUrl]);

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Preview on your mobile</DialogTitle>
          <DialogDescription>
            Scan this QR code with the Expo Go app to open your project.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Expo QR" className="h-[220px] w-[220px] rounded-lg border border-slate-200 dark:border-slate-700/50 bg-white p-2" />
          ) : (
            <div className="text-sm text-slate-500">No Expo URL detected.</div>
          )}
          {expoUrl && (
            <div className="text-xs text-slate-500 break-all text-center">{expoUrl}</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ExpoQrModal;
