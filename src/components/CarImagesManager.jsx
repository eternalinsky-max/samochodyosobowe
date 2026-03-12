// src/components/CarImagesManager.jsx
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
  const [progress, setProgress] = useState({}); // { [name]: percent }

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    const unsub = auth?.onAuthStateChanged?.(async (u) => {
      setUser(u ?? null);
      if (u?.getIdToken) {
        const t = await u.getIdToken();
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
      return setErr("Nieprawidłowy URL (musi zaczynać się od http/https).");

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
      setInfo("Zdjęcie dodane (URL).");
      await refresh();
    } catch (e2) {
      setErr(e2?.message || "Nie udało się dodać zdjęcia.");
    } finally {
      setLoading(false);
    }
  }

  async function removeImage(imageId) {
    setErr("");
    setInfo("");

    if (!token) return setErr("Zaloguj się, aby usuwać zdjęcia.");

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

      setInfo("Zdjęcie usunięte.");
      await refresh();
    } catch (e) {
      setErr(e?.message || "Nie udało się usunąć zdjęcia.");
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

  // ✅ IMPORTANT: для production rules потрібно створити carOwners/<carId> перед upload
  async function ensureOwnerDoc(freshToken) {
    const t = freshToken || token;
    if (!t) throw new Error("Brak tokenu logowania. Zaloguj się ponownie.");

    const res = await fetch(`/api/cars/${carId}/owner`, {
      method: "POST",
      headers: { "x-id-token": t },
      cache: "no-store",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || `OWNER_HTTP_${res.status}`);
    }
  }

  async function uploadAll() {
    setErr("");
    setInfo("");

    if (!user) return setErr("Zaloguj się, aby dodawać zdjęcia.");
    if (!storage) return setErr("Firebase Storage nie jest skonfigurowany.");
    if (!files.length) return setErr("Wybierz przynajmniej jedno zdjęcie.");

    setUploading(true);
    setProgress({});

    try {
      // ✅ одразу беремо свіжий токен (щоб не був прострочений)
      const freshToken = await user.getIdToken?.(true);
      if (!freshToken) throw new Error("Brak tokenu logowania. Zaloguj się ponownie.");
      setToken(freshToken);

      // ✅ критично: створити документ owner у Firestore
      await ensureOwnerDoc(freshToken);

      // upload sequentially
      for (const file of files) {
        const safeName = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `car-listings/${carId}/${Date.now()}_${safeName}`;
        const storageRef = ref(storage, path);

        const task = uploadBytesResumable(storageRef, file, {
          contentType: file.type || "image/jpeg",
        });

        await new Promise((resolve, reject) => {
          task.on(
            "state_changed",
            (snap) => {
              const pct = Math.round(
                (snap.bytesTransferred / snap.totalBytes) * 100
              );
              setProgress((p) => ({ ...p, [file.name]: pct }));
            },
            (error) => reject(error),
            () => resolve()
          );
        });

        const downloadURL = await getDownloadURL(task.snapshot.ref);

        // save URL in DB
        const res = await fetch(`/api/cars/${carId}/images`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-id-token": freshToken,
          },
          body: JSON.stringify({ url: downloadURL }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error || `HTTP ${res.status} (zapisywanie w DB)`);
        }
      }

      setFiles([]);
      setProgress({});
      setInfo("Zdjęcia zostały dodane.");
      await refresh();
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Nie udało się wgrać zdjęć.");
    } finally {
      setUploading(false);
    }
  }

  const card =
    "rounded-2xl border border-white/20 bg-white/85 shadow-[0_20px_60px_rgba(0,0,0,0.20)] backdrop-blur-xl";
  const input =
    "h-11 w-full rounded-xl border border-slate-900/15 bg-white/80 px-4 text-sm text-slate-900 " +
    "outline-none placeholder:text-slate-400 focus:border-red-600/70 focus:ring-4 focus:ring-red-600/15";
  const btn =
    "inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-semibold text-white " +
    "shadow-[0_12px_30px_rgba(220,38,38,0.25)] hover:bg-red-500 active:bg-red-700 " +
    "focus:outline-none focus:ring-4 focus:ring-red-600/20";
  const btnGhost =
    "inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 " +
    "hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-black/5";
  const btnDisabled =
    "inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-400";

  return (
    <section className={`${card} p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">Zdjęcia</div>
          <div className="mt-1 text-xs text-slate-600">
            Możesz dodać zdjęcia plikiem (Firebase Storage) albo przez URL.
          </div>
        </div>

        <button
          type="button"
          className={!canEdit || loading ? btnDisabled : btnGhost}
          onClick={refresh}
          disabled={!canEdit || loading}
        >
          Odśwież
        </button>
      </div>

      {!user ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          Zaloguj się jako właściciel ogłoszenia, aby dodawać/usuwać zdjęcia.
        </div>
      ) : null}

      {err ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      {info ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {info}
        </div>
      ) : null}

      {/* UPLOAD FILES */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white/70 p-4">
        <div className="text-sm font-semibold text-slate-900">
          Dodaj zdjęcia (plik)
        </div>
        <div className="mt-1 text-xs text-slate-600">
          Wybierz zdjęcia z telefonu/komputera → kliknij “Wgraj”.
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onPickFiles}
            disabled={!canEdit || uploading}
            className="block text-sm"
          />

          <button
            type="button"
            onClick={uploadAll}
            className={!canEdit || uploading ? btnDisabled : btn}
            disabled={!canEdit || uploading}
          >
            {uploading ? "Wgrywanie…" : "Wgraj"}
          </button>

          {files.length ? (
            <div className="text-xs text-slate-600">
              Wybrano: <b className="text-slate-900">{files.length}</b>
            </div>
          ) : null}
        </div>

        {/* previews + progress */}
        {previews.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {previews.map((p) => (
              <div
                key={p.name}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="relative h-32 bg-slate-100">
                  <img
                    src={p.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {p.name}
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-red-600"
                      style={{ width: `${progress[p.name] ?? 0}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    {progress[p.name] ?? 0}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* ADD BY URL */}
      <form onSubmit={addByUrl} className="mt-5 grid gap-3 md:grid-cols-12">
        <div className="md:col-span-9">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Wklej URL zdjęcia (https://...)"
            className={input}
            disabled={!canEdit || loading}
          />
        </div>

        <div className="md:col-span-3">
          <button
            type="submit"
            className={!canEdit || loading ? btnDisabled : btn}
            disabled={!canEdit || loading}
          >
            Dodaj URL
          </button>
        </div>
      </form>

      {/* LIST */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items?.length ? (
          items.map((img) => (
            <div
              key={img.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="relative h-40 bg-slate-100">
                <img
                  src={img.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex items-center justify-between gap-2 p-3">
                <div className="min-w-0 text-xs text-slate-500 truncate">
                  {img.url}
                </div>

                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className={
                    !canEdit || loading
                      ? "rounded-lg bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-500"
                      : "rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-500"
                  }
                  disabled={!canEdit || loading}
                >
                  Usuń
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            Brak zdjęć w ogłoszeniu.
          </div>
        )}
      </div>
    </section>
  );
}
