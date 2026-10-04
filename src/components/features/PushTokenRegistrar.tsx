"use client";

import { registerPushToken } from "@/actions/pushActions";
import { useEffect } from "react";

/** Inside the SE mobile apps: sends the device's push token to the server once the user is logged in. */
export default function PushTokenRegistrar() {
  useEffect(() => {
    const send = (token?: string | null) => {
      if (token) registerPushToken(token).catch(() => {});
    };
    send((window as unknown as { SE_PUSH_TOKEN?: string }).SE_PUSH_TOKEN);
    const onToken = (e: Event) => send((e as CustomEvent<string>).detail);
    window.addEventListener("se-push-token", onToken);
    return () => window.removeEventListener("se-push-token", onToken);
  }, []);
  return null;
}
