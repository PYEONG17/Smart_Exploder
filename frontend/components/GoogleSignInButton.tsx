"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { loginWithGoogle, type AuthResult } from "@/lib/api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme: "outline";
              size: "large";
              text: "continue_with";
              width: number;
            },
          ) => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  role?: "STUDENT" | "TEACHER";
  onSuccess: (result: AuthResult) => void;
  onError: (error: unknown) => void;
}

export function GoogleSignInButton({
  role = "STUDENT",
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const callbacksRef = useRef({ onSuccess, onError, role });
  useEffect(() => {
    callbacksRef.current = { onSuccess, onError, role };
  }, [onSuccess, onError, role]);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const initializeGoogleButton = () => {
    const container = buttonRef.current;
    const googleIdentity = window.google?.accounts.id;
    if (!container || !googleIdentity || !clientId) return;

    googleIdentity.initialize({
      client_id: clientId,
      callback: ({ credential }) => {
        void loginWithGoogle(credential, callbacksRef.current.role)
          .then((result) => callbacksRef.current.onSuccess(result))
          .catch((error: unknown) => callbacksRef.current.onError(error));
      },
    });
    googleIdentity.renderButton(container, {
      theme: "outline",
      size: "large",
      text: "continue_with",
      width: Math.min(container.clientWidth, 400),
    });
  };

  return (
    <div className="w-full">
      {clientId ? (
        <>
          <div ref={buttonRef} className="flex min-h-10 justify-center" />
          <Script
            src="https://accounts.google.com/gsi/client"
            strategy="afterInteractive"
            onReady={initializeGoogleButton}
            onError={() =>
              callbacksRef.current.onError(
                new Error(
                  "Không tải được Google Sign-In. Hãy kiểm tra kết nối mạng rồi thử lại.",
                ),
              )
            }
          />
        </>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            onError(
              new Error(
                "Chưa cấu hình Google OAuth. Hãy thêm NEXT_PUBLIC_GOOGLE_CLIENT_ID vào frontend/.env.local và GOOGLE_CLIENT_ID vào backend/.env.",
              ),
            )
          }
          className="w-full rounded-xl border-border bg-background py-6 flex items-center justify-center gap-3 transition-colors hover:bg-muted"
        >
          <FcGoogle className="h-5 w-5" />
          <span className="text-sm font-semibold">Tiếp tục với Google</span>
        </Button>
      )}
    </div>
  );
}
