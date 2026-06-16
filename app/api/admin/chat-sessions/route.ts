import { NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const dbClient = supabaseAdmin || supabase;
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      // Fetch messages for a specific session
      const { data: messages, error: msgErr } = await dbClient
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (msgErr) {
        throw msgErr;
      }

      return NextResponse.json({ messages });
    }

    // Fetch all sessions
    const { data: sessions, error: sessionErr } = await dbClient
      .from("chat_sessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (sessionErr) {
      throw sessionErr;
    }

    // Fetch all profiles to map users roles
    const { data: profiles } = await dbClient
      .from("profiles")
      .select("*");

    const profilesMap: Record<string, any> = {};
    if (profiles) {
      profiles.forEach((p: any) => {
        profilesMap[p.id] = p;
      });
    }

    // Fetch message counts for all sessions
    const { data: counts } = await dbClient
      .from("chat_messages")
      .select("session_id");

    const messageCounts: Record<string, number> = {};
    if (counts) {
      counts.forEach((msg: any) => {
        if (msg.session_id) {
          messageCounts[msg.session_id] = (messageCounts[msg.session_id] || 0) + 1;
        }
      });
    }

    // Map sessions to admin display format
    const result = sessions.map((s: any) => {
      const profile = profilesMap[s.user_id];
      return {
        id: s.id,
        userId: s.user_id,
        guestId: s.guest_id,
        role: profile?.role || "guest",
        username: s.user_id 
          ? `User (${s.user_id.substring(0, 8)})` 
          : `Guest (${s.guest_id ? s.guest_id.substring(0, 8) : "Unknown"})`,
        createdAt: s.created_at,
        messageCount: messageCounts[s.id] || 0,
      };
    });

    return NextResponse.json({ sessions: result });
  } catch (err) {
    const error = err as Error;
    console.error("Admin chat sessions fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
