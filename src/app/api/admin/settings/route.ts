import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  DEFAULT_HERO_IMAGE,
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
        heroImageUrl: DEFAULT_HERO_IMAGE,
      },
      source: "fallback",
    });
  }

  try {
    const { data, error } = await supabase
      .from("store_settings")
      .select("key, value")
      .in("key", ["seller_whatsapp", "hero_image_url"]);

    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01") {
        return NextResponse.json({
          ok: true,
          settings: {
            sellerWhatsApp: SELLER_WHATSAPP,
            sellerWhatsAppDisplay: SELLER_WHATSAPP_DISPLAY,
            heroImageUrl: DEFAULT_HERO_IMAGE,
          },
          source: "fallback",
          needsTableSetup: true,
        });
      }
      throw error;
    }

    let rawWa = SELLER_WHATSAPP;
    let heroImageUrl = DEFAULT_HERO_IMAGE;

    if (Array.isArray(data)) {
      for (const row of data) {
        if (row.key === "seller_whatsapp" && row.value) {
          rawWa = row.value;
        } else if (row.key === "hero_image_url" && row.value?.trim()) {
          heroImageUrl = row.value.trim();
        }
      }
    }

    const cleanWa = normalizeWhatsAppNumber(rawWa);

    return NextResponse.json({
      ok: true,
      settings: {
        sellerWhatsApp: cleanWa,
        sellerWhatsAppDisplay: formatWhatsAppDisplay(cleanWa),
        heroImageUrl,
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
    const upsertRows: {
      key: string;
      value: string;
      description: string;
      updated_at: string;
    }[] = [];

    let responseWa: string | undefined;
    let responseWaDisplay: string | undefined;
    let responseHeroImage: string | undefined;

    if (body.sellerWhatsApp !== undefined) {
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

      upsertRows.push({
        key: "seller_whatsapp",
        value: normalized,
        description: "Nomor WhatsApp resmi Ciamis Pandan Craft untuk menerima pesanan",
        updated_at: new Date().toISOString(),
      });
      responseWa = normalized;
      responseWaDisplay = formatWhatsAppDisplay(normalized);
    }

    if (body.heroImageUrl !== undefined) {
      const cleanHero = String(body.heroImageUrl || "").trim() || DEFAULT_HERO_IMAGE;
      upsertRows.push({
        key: "hero_image_url",
        value: cleanHero,
        description: "Gambar utama (Hero Image) yang tampil di halaman depan Homepage",
        updated_at: new Date().toISOString(),
      });
      responseHeroImage = cleanHero;
    }

    if (upsertRows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Tidak ada data pengaturan yang dikirim." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("store_settings").upsert(upsertRows);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      sellerWhatsApp: responseWa,
      sellerWhatsAppDisplay: responseWaDisplay,
      heroImageUrl: responseHeroImage,
      message: "Pengaturan toko berhasil diperbarui.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui pengaturan";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
