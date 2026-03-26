"use client";

import React, { useEffect, useMemo, useState } from "react";
import { auth, storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export default function CarImagesManager({ carId, initialImages = [] }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");

  const [url, setUrl] = useState("");
  const [items, setItems] = useState(initialImages);

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  // 🔥 AUTH (FIX TOKEN)
  useEffect(() => {
    const unsub = auth?.onAuthStateChanged?.(async (u) => {
      setUser(u ?? null);

      if (u?.getIdToken) {
        const t = await u.getIdToken(true); // ✅ FIX
        setToken(t || "");
      } else {
        setToken("");
      }
    });

    return () => unsub?.();
  }, []);

  const canEdit = !!token;

  const previews = useMemo(() => {
    return files.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
      size: f.size,
      type: f.type,
    }));
  }, [files]);

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  // 🔥 AUTO LOAD
  useEffect(() => {
    if (token && carId) {
      refresh();
    }
  }, [token, carId]);

  async function refresh() {
    if (!token) return;

    setLoading(true);
    setErr("");
    setInfo("");

    try {
      const res = await fetch(`/api/cars/${carId}/images`, {
        headers: { "x-id-token": token },
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setErr(e?.message || "Nie udało się załadować zdjęć.");
    } finally {
      setLoading(false);
    }
  }

  async function addByUrl(e) {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!token) return setErr("Zaloguj się, aby dodawać zdjęcia.");

    const u = url.trim();
    if (!u) return setErr("Podaj URL zdjęcia.");
    if (!/^https?:\/\/.+/i.test(u))
      return setErr("Nieprawidłowy URL.");

    setLoading(true);

    try {
      const res = await fetch(`/api/cars/${carId}/images`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-id-token": token,
        },
        body: JSON.stringify({ url: u }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      setUrl("");
      setInfo("Zdjęcie dodane.");
      await refresh();
    } catch (e) {
      setErr(e?.message || "Błąd dodawania zdjęcia.");
    } finally {
      setLoading(false);
    }
  }

  async function removeImage(imageId) {
    setErr("");
    setInfo("");

    if (!token) return setErr("Zaloguj się.");

    setLoading(true);

    try {
      const res = await fetch(
        `/api/cars/${carId}/images?imageId=${encodeURIComponent(imageId)}`,
        {
          method: "DELETE",
          headers: { "x-id-token": token },
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      setInfo("Usunięto.");
      await refresh();
    } catch (e) {
      setErr(e?.message || "Błąd usuwania.");
    } finally {
      setLoading(false);
    }
  }

  function onPickFiles(e) {
    setErr("");
    setInfo("");

    const list = Array.from(e.target.files || []);
    const onlyImages = list.filter((f) => f.type.startsWith("image/"));

    setFiles(onlyImages);
  }

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

        await fetch(`/api/cars/${carId}/images`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-id-token": freshToken,
          },
          body: JSON.stringify({ url }),
        });
      }

      setFiles([]);
      setProgress({});
      setInfo("Zdjęcia dodane.");
      await refresh();
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Upload error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/20 bg-white/85 p-6">
      <div className="text-sm font-semibold">Zdjęcia</div>

      <input type="file" multiple onChange={onPickFiles} />

      <button onClick={uploadAll} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>

      <div className="grid grid-cols-3 gap-2 mt-4">
        {items.map((img) => (
          <div key={img.id}>
            <img src={img.url} className="h-24 w-full object-cover" />
            <button onClick={() => removeImage(img.id)}>X</button>
          </div>
        ))}
      </div>
    </section>
  );
}