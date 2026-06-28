import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AnnouncementBar() {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    supabase.from("announcements").select("message").eq("is_active", true).order("sort_order")
      .then(({ data }) => setMessages((data ?? []).map((d) => d.message)));
  }, []);

  if (messages.length === 0) return null;
  const loop = [...messages, ...messages];

  return (
    <div className="bg-primary text-primary-foreground overflow-hidden border-b border-primary/40">
      <div className="marquee-track py-2 text-xs tracking-wider">
        {loop.map((m, i) => (
          <span key={i} className="px-8 inline-flex items-center gap-2">
            <span className="text-gold">✦</span> {m}
          </span>
        ))}
      </div>
    </div>
  );
}
