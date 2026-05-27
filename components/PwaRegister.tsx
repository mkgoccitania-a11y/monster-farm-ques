"use client";

import { useEffect } from "react";

/**
 * Enregistre le Service Worker côté client.
 * Sans SW, Chrome n'affiche pas le bouton "Installer l'application".
 *
 * En localhost et en HTTPS, l'enregistrement fonctionne.
 * En HTTP sur LAN, certains navigateurs refusent (sécurité) — c'est attendu.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // On enregistre dès que la page est idle pour ne pas bloquer le rendu initial
    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        // Service Worker non enregistré (HTTP non-localhost, ou bloqué par le navigateur)
        // L'app reste fonctionnelle, juste non-installable.
      }
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
