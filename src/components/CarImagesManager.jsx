"use client";

import React, { useEffect, useMemo, useState } from "react";
import { auth, storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export default function CarImagesManager({ carId, initialImages = [] }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");

  const [items, setItems] = useState(initialImages);
  const [files, setFiles] = useState([]);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  // 🔐 AUTH
  useEffect(() => {
    const unsub = auth?.onAuthStateChanged?.(async (u) => {
      setUser(u ?? null);

      if (u?.getIdToken) {
        const t = await u.getIdToken(true);
        setToken(t || "");
      } else {
        setToken("");
      }
    });

    return () => unsub?.();
  }, []);

  const canEdit = !!token;

  // 📸 PREVIEW
  const previews = useMemo(() => {
    return files.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
    }));
  }, [files]);

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  // 🚫 БЕЗ carId
  if (!carId) {
    return (
      <div className="text-sm text-gray-500 mt-4">
        Najpierw zapisz auto, aby dodać zdjęcia.
      </div>
    );
  }

  // 🔄 LOAD
  useEffect(() => {
    if (token && carId) {
      refresh();
    }
  }, [token, carId]);

  async function refresh() {
    if (!token) return;

    setLoading(true);
    setErr("");

    try {
      const res = await fetch(`/api/cars/${carId}/images`, {
        headers: { "x-id-token": token },
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Load error");

      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  // 📂 SELECT FILES
  function onPickFiles(e) {
    setErr("");
    setInfo("");

    const list = Array.from(e.target.files || []);

    const onlyImages = list.filter(
      (f) =>
        f.type.startsWith("image/") &&
        f.size < 5 * 1024 * 1024 // 5MB
    );

    setFiles(onlyImages);
  }

  // 🔑 OWNER CHECK
  async function ensureOwnerDoc(freshToken) {
    const res = await fetch(`/api/cars/${carId}/owner`, {
      method: "POST",
      headers: { "x-id-token": freshToken },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || "OWNER ERROR");
    }
  }

  // 🚀 UPLOAD
  async function uploadAll() {
    setErr("");
    setInfo("");

    if (!user) return setErr("Zaloguj się.");
    if (!files.length) return setErr("Wybierz zdjęcia.");

    setUploading(true);
    setProgress({});

    try {
      const freshToken = await user.getIdToken(true);
      setToken(freshToken);

      await ensureOwnerDoc(freshToken);

      for (const file of files) {
        const safeName = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `car-listings/${carId}/${Date.now()}_${safeName}`;

        const storageRef = ref(storage, path);
        const task = uploadBytesResumable(storageRef, file);

        await new Promise((resolve, reject) => {
          task.on(
            "state_changed",
            (snap) => {
              const pct = Math.round(
                (snap.bytesTransferred / snap.totalBytes) * 100
              );
              setProgress((p) => ({ ...p, [file.name]: pct }));
            },
            reject,
            resolve
          );
        });

        const url = await getDownloadURL(task.snapshot.ref);

        const res = await fetch(`/api/cars/${carId}/images`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-id-token": freshToken,
          },
          body: JSON.stringify({ url }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || "API ERROR");
        }
      }

      setFiles([]);
      setProgress({});
      setInfo("Zdjęcia dodane.");
      await refresh();
    } catch (e) {
      console.error(e);
      setErr(e.message || "Upload error");
    } finally {
      setUploading(false);
    }
  }

  // ❌ DELETE
  async function removeImage(imageId) {
    setErr("");

    try {
      const res = await fetch(
        `/api/cars/${carId}/images?imageId=${encodeURIComponent(imageId)}`,
        {
          method: "DELETE",
          headers: { "x-id-token": token },
        }
      );

      if (!res.ok) throw new Error("Delete error");

      await refresh();
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <section className="rounded-2xl border border-white/20 bg-white/85 p-6 mt-6">
      <div className="text-sm font-semibold mb-3">Zdjęcia</div>

      {/* FILE INPUT */}
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={onPickFiles}
      />

      {/* PREVIEW */}
      {previews.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {previews.map((p) => (
            <img
              key={p.name}
              src={p.url}
              className="h-20 w-20 object-cover rounded"
            />
          ))}
        </div>
      )}

      {/* UPLOAD BUTTON */}
      <button
        onClick={uploadAll}
        disabled={uploading || !canEdit}
        className="mt-3 px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {/* PROGRESS */}
      {Object.entries(progress).map(([name, pct]) => (
        <div key={name} className="text-xs mt-1">
          {name} — {pct}%
        </div>
      ))}

      {/* ERRORS */}
      {err && <div className="text-red-500 mt-2 text-sm">{err}</div>}
      {info && <div className="text-green-600 mt-2 text-sm">{info}</div>}

      {/* EXISTING IMAGES */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {items.map((img) => (
          <div key={img.id} className="relative">
            <img
              src={img.url}
              className="h-24 w-full object-cover rounded"
            />
            <button
              onClick={() => removeImage(img.id)}
              className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 rounded"
            >
              X
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}