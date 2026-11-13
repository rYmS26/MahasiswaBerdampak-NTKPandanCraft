import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  SELLER_WHATSAPP,
  SELLER_WHATSAPP_DISPLAY,
  formatWhatsAppDisplay,
  normalizeWhatsAppNumber,
} from "@/lib/format";

export async function GET() {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Akses ditolak. Silakan login." }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({
      ok: true,
      settings: {
        sellerWhatsApp: SELLER_WHATSAPP,
        sellerWhatsAppDisplay: SELLER_WHATSAPP_DISPLAY,
      },
      source: "fallback",
    });
  }

  try {
    const { data, error } = await supabase
      .from("store_settings")
      .select("key, value")
      .eq("key", "seller_whatsapp")
      .maybeSingle();

    if (error) throw error;

    const rawWa = data?.value || SELLER_WHATSAPP;
    const cleanWa = normalizeWhatsAppNumber(rawWa);

    return NextResponse.json({
      ok: true,
      settings: {
        sellerWhatsApp: cleanWa,
        sellerWhatsAppDisplay: formatWhatsAppDisplay(cleanWa),
      },
      source: "supabase",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memuat pengaturan";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Akses ditolak. Silakan login." }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Koneksi database admin Supabase belum dikonfigurasi." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const inputPhone = String(body.sellerWhatsApp || "").trim();
    const normalized = normalizeWhatsAppNumber(inputPhone);

    if (normalized.length < 10 || normalized.length > 16) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Format nomor WhatsApp tidak valid. Masukkan minimal 10 digit nomor aktif (contoh: 08815838516 atau 628815838516).",
        },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("store_settings").upsert({
      key: "seller_whatsapp",
      value: normalized,
      description: "Nomor WhatsApp resmi Ciamis Pandan Craft untuk menerima pesanan",
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      sellerWhatsApp: normalized,
      sellerWhatsAppDisplay: formatWhatsAppDisplay(normalized),
      message: "Nomor WhatsApp penjual berhasil diperbarui.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui pengaturan";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
