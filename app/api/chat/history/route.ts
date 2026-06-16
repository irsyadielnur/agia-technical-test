import { NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { userId, guestId } = await req.json();

    const dbClient = supabaseAdmin || supabase;

    let session = null;

    if (userId) {
      const { data, error } = await dbClient
        .from("chat_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching user session:", error);
      } else if (data && data.length > 0) {
        session = data[0];
      }
    } else if (guestId) {
      const { data, error } = await dbClient
        .from("chat_sessions")
        .select("*")
        .eq("guest_id", guestId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching guest session:", error);
      } else if (data && data.length > 0) {
        session = data[0];
      }
    }

    if (!session) {
      return NextResponse.json({ sessionId: null, messages: [] });
    }

    const { data: dbMessages, error: msgError } = await dbClient
      .from("chat_messages")
      .select("*")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true });

    if (msgError) {
      console.error("Error fetching session messages:", msgError);
      return NextResponse.json({ sessionId: session.id, messages: [] });
    }

    const messages = dbMessages.map((m: any) => ({
      id: m.id,
      sender: m.role === "user" ? "user" : "bot",
      text: m.content,
      timestamp: new Date(m.created_at),
    }));

    return NextResponse.json({ sessionId: session.id, messages });
  } catch (err) {
    const error = err as Error;
    console.error("Chat history error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
