import { NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { messages, userId, guestId, sessionId } = await req.json();

    const dbClient = supabaseAdmin || supabase;

    const { data: products, error } = await dbClient
      .from("products")
      .select("id, name, description, price, category, stock");

    if (error) {
      console.error("Error fetching products:", error);
    }

    const productCatalogStr = products
      ? products
          .map(
            (p) =>
              `- ID: ${p.id}\n  Nama: ${p.name}\n  Kategori: ${p.category}\n  Harga: Rp ${p.price}\n  Stok: ${p.stock} unit\n  Deskripsi: ${p.description}`,
          )
          .join("\n\n")
      : "Katalog kosong.";

    const systemPrompt = `
    Kamu adalah UNEEYA AI, asisten virtual resmi untuk toko e-commerce UNEEYA.
    Tugas kamu adalah melayani dan membantu pelanggan UNEEYA dengan gaya santai dan friendly. namun, tetap profesional.

    Aturan Penting:
    1. Hanya jawab pertanyaan dalam lingkup toko UNEEYA (produk, harga, stok, kategori, alamat toko, kontak, cara beli). Jika ditanya hal di luar toko, jawab secara sopan bahwa kamu hanya bisa membantu seputar layanan UNEEYA.
    
    2. DATA PENGGUNA LAIN SANGAT TIDAK BOLEH DIBERIKAN. Jika ada yang menanyakan tentang transaksi, email, alamat, atau data pelanggan lain, jawab secara tegas bahwa informasi tersebut bersifat rahasia dan tidak dapat dibagikan.
    
    3. kamu harus memberikan rekomendasi produk yang KONSISTEN. Jika ditanyakan pertanyaan rekomendasi/saran produk yang sama, berikan produk yang sama.
    
    4. JIKA pengguna mencari, meminta saran, rekomendasi, atau menyatakan minat membeli produk, Anda WAJIB memberikan saran produk dari katalog di bawah. Di akhir pesan Anda (pada baris paling terakhir), sertakan tag:
    [RECOMMENDED_IDS: id_1, id_2, ...]
    Ganti id_n dengan ID produk yang sesungguhnya yang Anda rekomendasikan (berikan 3 hingga 5 ID produk). Format ini harus presisi agar sistem UI dapat merender kartu produk. Jangan tambahkan spasi atau teks lain setelah tag tersebut. Jika pengguna tidak meminta rekomendasi produk, JANGAN sertakan tag ini.
    
    5. rekomendasi pada pesan harus sama urutannya dengan card product yang ditampilkan

    Berikut adalah Katalog Produk Resmi UNEEYA:
    ${productCatalogStr}

    Alamat Toko Fisik: Jakarta Timur.
    WhatsApp CS: +62 812-6816-5759
    Email: support@uneeya.com
    `;

    // Find or create chat session
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const { data: newSession, error: sessionErr } = await dbClient
        .from("chat_sessions")
        .insert({
          user_id: userId || null,
          guest_id: userId ? null : (guestId || null),
        })
        .select()
        .single();

      if (sessionErr) {
        console.error("Error creating chat session:", sessionErr);
      } else if (newSession) {
        activeSessionId = newSession.id;
      }
    }

    // Save user message to database
    const userMsg = messages[messages.length - 1];
    if (activeSessionId && userMsg && userMsg.sender === "user") {
      const { error: insertUserErr } = await dbClient
        .from("chat_messages")
        .insert({
          session_id: activeSessionId,
          role: "user",
          content: userMsg.text,
        });
      if (insertUserErr) {
        console.error("Error inserting user message:", insertUserErr);
      }
    }

    // Format messages for Gemini API.
    // Gemini rules:
    // 1. First message must be 'user'.
    // 2. Roles must alternate between 'user' and 'model'.
    // 3. No consecutive messages of the same role.
    const geminiContents: any[] = [];
    let expectedRole = "user";
    
    for (const m of messages) {
      const role = m.sender === "user" ? "user" : "model";
      
      // Skip any leading model messages (like the initial greeting)
      if (geminiContents.length === 0 && role === "model") {
        continue;
      }
      
      if (role === expectedRole) {
        geminiContents.push({
          role: role,
          parts: [{ text: m.text }],
        });
        expectedRole = role === "user" ? "model" : "user";
      } else {
        // Merge consecutive messages of the same role
        if (geminiContents.length > 0) {
          const lastMsg = geminiContents[geminiContents.length - 1];
          if (lastMsg.role === role) {
            lastMsg.parts[0].text += "\n" + m.text;
          }
        }
      }
    }

    const apiKey = process.env.NEXT_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API Key is not configured." },
        { status: 500 },
      );
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: geminiContents,
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        generationConfig: {
          temperature: 0.1,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Gemini API error: ${errText}`);
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = geminiRes.body?.getReader();

    if (!reader) {
      throw new Error("No reader available for Gemini response.");
    }

    const customStream = new ReadableStream({
      async start(controller) {
        let tempBuffer = "";
        let jsonStart = -1;
        let braceCount = 0;
        let inString = false;
        let escape = false;
        let fullBotText = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              
              // Save assistant message to database
              if (activeSessionId && fullBotText.trim()) {
                const { error: insertBotErr } = await dbClient
                  .from("chat_messages")
                  .insert({
                    session_id: activeSessionId,
                    role: "assistant",
                    content: fullBotText.trim(),
                  });
                if (insertBotErr) {
                  console.error("Error inserting assistant message:", insertBotErr);
                }
              }
              break;
            }

            tempBuffer += decoder.decode(value, { stream: true });

            for (let i = 0; i < tempBuffer.length; i++) {
              const char = tempBuffer[i];
              if (escape) {
                escape = false;
                continue;
              }
              if (char === "\\") {
                escape = true;
                continue;
              }
              if (char === '"') {
                inString = !inString;
                continue;
              }
              if (!inString) {
                if (char === "{") {
                  if (braceCount === 0) {
                    jsonStart = i;
                  }
                  braceCount++;
                } else if (char === "}") {
                  braceCount--;
                  if (braceCount === 0 && jsonStart !== -1) {
                    const potentialJson = tempBuffer.substring(
                      jsonStart,
                      i + 1,
                    );
                    try {
                      const parsed = JSON.parse(potentialJson);
                      const text =
                        parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                      if (text) {
                        fullBotText += text;
                        controller.enqueue(encoder.encode(text));
                      }
                    } catch (e) {
                      // ignore parse errors for incomplete objects
                    }
                    tempBuffer = tempBuffer.substring(i + 1);
                    i = -1;
                    jsonStart = -1;
                  }
                }
              }
            }
          }
        } catch (e) {
          controller.error(e);
        }
      },
    });

    return new Response(customStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "x-session-id": activeSessionId || "",
        "Access-Control-Expose-Headers": "x-session-id",
      },
    });
  } catch (err) {
    const error = err as Error;
    console.error("Chat API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
