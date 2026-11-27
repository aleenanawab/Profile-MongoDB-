'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { QrCode, Camera, ArrowRight, Download, Copy, Check, AlertCircle } from 'lucide-react';
import { ProfileData, UserSession } from '@/types/profile';
import { AvtivePlatformHeader } from '@/components/layout/AvtivePlatformHeader';
import { OwnerBottomNav } from '@/components/layout/OwnerBottomNav';
import { trackOwnerShareEvent } from '@/lib/sharing/trackShareEvent';

interface ScanPageClientProps {
  profiles: ProfileData[];
  user: UserSession;
}

export function ScanPageClient({ profiles, user }: ScanPageClientProps) {
  const router = useRouter();
  const [selectedProfileId, setSelectedProfileId] = useState<string>(profiles[0]?.id || '');
  const activeProfile = profiles.find((p) => p.id === selectedProfileId) || profiles[0];
  const profileHref = activeProfile ? `/profile/${activeProfile.slug || activeProfile.id}` : '/dashboard';

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [scanInput, setScanInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const shareUrl =
    typeof window !== 'undefined' && activeProfile
      ? `${window.location.origin}/profile/${activeProfile.slug || activeProfile.id}?source=qr`
      : '';

  useEffect(() => {
    if (!shareUrl || !activeProfile) return;
    let cancelled = false;
    QRCode.toDataURL(shareUrl, {
      width: 260,
      margin: 2,
      color: { dark: '#18181b', light: '#ffffff' }
    })
      .then((url) => {
        if (!cancelled) {
          setQrDataUrl(url);
          void trackOwnerShareEvent({
            profileId: activeProfile.id,
            eventType: 'qr_generated',
            channel: 'qr',
            targetType: 'public_profile'
          });
        }
      })
      .catch((err) => console.error('QR generation failed:', err));
    return () => {
      cancelled = true;
    };
  }, [shareUrl, activeProfile]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleResolveScanInput = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = scanInput.trim();
    if (!raw) return;

    try {
      if (raw.startsWith('http://') || raw.startsWith('https://')) {
        const parsed = new URL(raw);
        router.push(`${parsed.pathname}${parsed.search}`);
        return;
      }
    } catch {
      // fall through
    }

    if (raw.startsWith('/')) {
      router.push(raw);
      return;
    }

    if (raw.startsWith('sl-') || raw.length > 24) {
      router.push(`/s/${encodeURIComponent(raw)}`);
      return;
    }

    router.push(`/profile/${encodeURIComponent(raw.replace(/^@/, ''))}`);
  };

  const handleToggleCamera = async () => {
    if (cameraActive) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setCameraActive(false);
      return;
    }

    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not available on this browser. Paste a profile link or handle below.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const Detector = (window as any).BarcodeDetector;
      if (Detector) {
        const detector = new Detector({ formats: ['qr_code'] });
        const scanTick = async () => {
          if (!streamRef.current || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes?.length && codes[0].rawValue) {
              setScanInput(codes[0].rawValue);
              streamRef.current.getTracks().forEach((t) => t.stop());
              streamRef.current = null;
              setCameraActive(false);
              return;
            }
          } catch {
            // continue polling frames
          }
          if (streamRef.current) {
            requestAnimationFrame(scanTick);
          }
        };
        requestAnimationFrame(scanTick);
      } else {
        setCameraError('Live QR auto-detection is not supported in this browser, but you can paste any link below.');
      }
    } catch {
      setCameraError('Unable to access camera. Check browser permissions or paste a link below.');
    }
  };

  const handleCopyQrLink = async () => {
    if (!shareUrl || !activeProfile) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    void trackOwnerShareEvent({
      profileId: activeProfile.id,
      eventType: 'link_copied',
      channel: 'qr',
      targetType: 'public_profile'
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-24">
      <AvtivePlatformHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="avtive-serif-name text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-white">
            Scan & QR Exchange
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Show your live QR pass at events or open another person&apos;s Avtive card or share token.
          </p>
        </div>

        {/* Scan / Open Link Card */}
        <section className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#7A1C33] dark:text-amber-300" />
              <span>Scan or Open Profile Link</span>
            </h2>
            <button
              type="button"
              onClick={handleToggleCamera}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{cameraActive ? 'Stop Camera' : 'Use Camera'}</span>
            </button>
          </div>

          {cameraActive && (
            <div className="rounded-xl overflow-hidden border border-stone-200 dark:border-zinc-800 bg-black aspect-video max-h-64">
              <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
            </div>
          )}

          {cameraError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{cameraError}</span>
            </div>
          )}

          <form onSubmit={handleResolveScanInput} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="Paste QR URL, @handle, or share link..."
              className="flex-1 h-11 px-3.5 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1C33]/30"
            />
            <button
              type="submit"
              className="min-h-[44px] px-4 rounded-xl bg-[#7A1C33] hover:bg-[#64162A] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Open Card</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </section>

        {/* My Live QR Code */}
        {activeProfile && (
          <section className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-4 sm:p-6 flex flex-col items-center text-center space-y-4">
            <div className="w-full flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#B88746]" />
                <span>Your Live QR Code</span>
              </h2>
              {profiles.length > 1 && (
                <select
                  value={activeProfile.id}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  aria-label="Select profile for QR code"
                  className="h-9 px-3 rounded-xl border border-stone-200 dark:border-zinc-800 bg-[#FAF7F2] dark:bg-zinc-950 text-xs font-semibold"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.profileName || p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {qrDataUrl ? (
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
                <img src={qrDataUrl} alt={`QR code for ${activeProfile.name}`} className="w-48 h-48 sm:w-56 sm:h-56" />
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleCopyQrLink}
                className="min-h-[40px] px-4 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-[#FAF7F2] dark:bg-zinc-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy QR Link'}</span>
              </button>
              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download={`${activeProfile.slug || activeProfile.id}-qr.png`}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#7A1C33] hover:bg-[#64162A] text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save QR PNG</span>
                </a>
              )}
              <Link
                href={`${profileHref}?share=true`}
                className="min-h-[40px] px-4 py-2 rounded-xl border border-[#B88746]/40 text-[#7A5926] dark:text-amber-300 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <span>Open Share Workspace</span>
              </Link>
            </div>
          </section>
        )}
      </main>

      <OwnerBottomNav profileHref={profileHref} />
    </div>
  );
}
