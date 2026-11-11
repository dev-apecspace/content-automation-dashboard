"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export function useRealtimeSubscription(
  table: string,
  callback: () => void,
  event: "*" | "INSERT" | "UPDATE" | "DELETE" = "*"
) {
  const router = useRouter();
  // Use a ref to keep track of the latest callback without triggering effect re-runs
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    // Create a channel for the specific table
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        "postgres_changes",
        {
          event: event,
          schema: "public",
          table: table,
        } as any,
        (payload: any) => {
          console.log(`Realtime change received for table ${table}:`, payload);
          // Invoke the latest callback
          if (savedCallback.current) {
            savedCallback.current();
          }
          router.refresh();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, router]);
}
