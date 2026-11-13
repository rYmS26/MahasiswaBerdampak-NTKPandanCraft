import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
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
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: "Tidak ada file gambar yang diunggah." }, { status: 400 });
    }

    // Validate mime type
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!validMimes.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: "Format file tidak didukung. Harap unggah file JPG, PNG, atau WebP." },
        { status: 400 }
      );
    }

    // Limit size to 5MB (client-side compression usually makes it < 300KB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: "Ukuran file terlalu besar. Maksimal 5 MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine extension
    let ext = "jpg";
    if (file.type === "image/png") ext = "png";
    else if (file.type === "image/webp") ext = "webp";
    else if (file.type === "image/svg+xml") ext = "svg";
    else if (file.type === "image/gif") ext = "gif";

    const fileName = `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const bucketName = "products";

    // Upload to Supabase Storage
    let { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    // If bucket was not created, try to create it and retry once
    if (uploadError && uploadError.message?.toLowerCase().includes("bucket not found")) {
      await supabase.storage.createBucket(bucketName, { public: true });
      const retry = await supabase.storage.from(bucketName).upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });
      uploadData = retry.data;
      uploadError = retry.error;
    }

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(uploadData?.path || fileName);

    return NextResponse.json({
      ok: true,
      url: publicUrlData.publicUrl,
      fileName,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengunggah gambar";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
