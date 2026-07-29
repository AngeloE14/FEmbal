/**
 * Reproducción de audio de bienvenida (una sola vez).
 * Estrategia por capas:
 *  1. Intenta reproducción normal (puede fallar por políticas de autoplay).
 *  2. Si falla, reproduce en silencio (muted) y luego reactiva el sonido.
 *  3. Reintenta cada 500ms durante los primeros segundos (algunos navegadores
 *     relajan la política tras la carga inicial).
 *  4. Escucha pageshow/visibilitychange para reintentar cuando la página se activa.
 *  5. Como último recurso, espera la primera interacción del usuario.
 *  6. Reproduce una sola vez (flag alreadyPlayed).
 */

import { memo, useEffect, useRef } from 'react';
import { assetUrl } from '../utils/paths';

export const AudioPlayer = memo(function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.55;

    let alreadyPlayed = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;
    const MAX_RETRIES = 6;

    const cleanup = () => {
      document.removeEventListener('pointerdown', playOnInteraction);
      document.removeEventListener('touchstart', playOnInteraction);
      document.removeEventListener('click', playOnInteraction);
      document.removeEventListener('keydown', playOnInteraction);
      if (retryTimer) clearTimeout(retryTimer);
    };

    const playUnmuted = async (): Promise<boolean> => {
      if (alreadyPlayed) return true;
      try {
        audio.muted = false;
        audio.volume = 0.55;
        await audio.play();
        alreadyPlayed = true;
        cleanup();
        return true;
      } catch {
        return false;
      }
    };

    const playMutedThenUnmute = async (): Promise<boolean> => {
      if (alreadyPlayed) return true;
      try {
        audio.muted = true;
        await audio.play();
        // Reproduciendo en silencio → reactivar sonido tras una fracción de segundo
        setTimeout(() => {
          if (!alreadyPlayed) {
            audio.muted = false;
            audio.volume = 0.55;
            alreadyPlayed = true;
            cleanup();
          }
        }, 150);
        return true;
      } catch {
        return false;
      }
    };

    const attemptPlay = async () => {
      if (alreadyPlayed) return;

      // Intento 1: reproducción normal (no silenciada)
      const ok = await playUnmuted();
      if (ok) return;

      // Intento 2: reproducción silenciada y luego reactivar sonido
      const mutedOk = await playMutedThenUnmute();
      if (mutedOk) return;

      // Si falló todo, reintentar más tarde
      if (retryCount < MAX_RETRIES) {
        retryCount += 1;
        retryTimer = setTimeout(attemptPlay, 500);
      }
    };

    const playOnInteraction = () => {
      if (alreadyPlayed) return;
      if (!audio.paused && audio.muted) {
        // Si ya está reproduciendo en silencio, solo reactivar sonido
        audio.muted = false;
        audio.volume = 0.55;
        alreadyPlayed = true;
        cleanup();
        return;
      }
      // Llamar a play() directamente (sin async/await) para preservar el gesto del usuario
      audio.muted = false;
      audio.volume = 0.55;
      const p = audio.play();
      if (p) {
        p.then(() => {
          if (!alreadyPlayed) {
            alreadyPlayed = true;
            cleanup();
          }
        }).catch(() => {
          if (alreadyPlayed) return;
          audio.muted = true;
          audio.play().then(() => {
            setTimeout(() => {
              if (!alreadyPlayed) {
                audio.muted = false;
                audio.volume = 0.55;
                alreadyPlayed = true;
                cleanup();
              }
            }, 150);
          }).catch(() => {});
        });
      } else {
        alreadyPlayed = true;
        cleanup();
      }
    };

    // Oyentes para primera interacción (fallback)
    document.addEventListener('pointerdown', playOnInteraction, { passive: true });
    document.addEventListener('touchstart', playOnInteraction, { passive: true });
    document.addEventListener('click', playOnInteraction, { passive: true });
    document.addEventListener('keydown', playOnInteraction);

    // Reintentar cuando la página se activa (pageshow/visibilitychange)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) void attemptPlay();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void attemptPlay();
    };
    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Disparar primer intento al montar y en canplay
    audio.addEventListener('canplay', () => void attemptPlay(), { once: true });
    void attemptPlay();

    return () => {
      cleanup();
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return <audio id="audioCarga" ref={audioRef} src={assetUrl('/assets/audio/sonido.mp3')} preload="auto" playsInline></audio>;
});
