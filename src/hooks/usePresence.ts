import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";

interface UsePresenceProps {
  user: User | null;
}

export function usePresence({ user }: UsePresenceProps) {
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.id) {
      setOnlineUserIds([]);
      return;
    }

    const presenceChannel = supabase.channel("online-users", {
      config: { presence: { key: user.id } },
    });

    const syncOnlineUsers = () => {
      const state = presenceChannel.presenceState();
      setOnlineUserIds(Object.keys(state));
    };

    presenceChannel
      .on("presence", { event: "sync" }, syncOnlineUsers)
      .on("presence", { event: "join" }, syncOnlineUsers)
      .on("presence", { event: "leave" }, syncOnlineUsers);

    presenceChannel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await presenceChannel.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
        });
      }
    });

    return () => {
      void supabase.removeChannel(presenceChannel);
    };
  }, [user?.id]);

  return {
    onlineUserIds,
  };
}
