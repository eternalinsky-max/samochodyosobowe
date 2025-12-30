"use client";

import React, { useEffect, useState } from "react";
import JobCardList from "@/components/JobCardList";
import Pagination from "@/components/Pagination";
import { auth } from "@/lib/firebase";

export default function MyJobsClient() {
  const [state, setState] = useState({
    items: [],
    total: 0,
    page: 1,
    perPage: 10,
    loading: true,
    error: null,
  });

  // завантаження списку "моїх оферт"
  useEffect(() => {
    const controller = new AbortController();

    async function fetchMyJobs() {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const token = await auth.currentUser?.getIdToken();

        const sp = new URLSearchParams();
        sp.set("page", String(state.page));
        sp.set("perPage", String(state.perPage));

        const res = await fetch(`/api/my-jobs?${sp.toString()}`, {
          method: "GET",
          signal: controller.signal,
          headers: { "x-id-token": token },
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        setState((prev) => ({
          ...prev,
          items: data.items ?? [],
          total: data.total ?? 0,
          page: data.page ?? prev.page,
          perPage: data.perPage ?? prev.perPage,
          loading: false,
          error: null,
        }));
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Failed to fetch my jobs:", err);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Nie udało się załadować ofert.",
        }));
      }
    }

    fetchMyJobs();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.page, state.perPage]);

  // 🔥 ось тут видаляємо оферту зі списку після успішного DELETE
  const handleJobDeleted = (deletedId) => {
    setState((prev) => {
      const filtered = prev.items.filter((job) => job.id !== deletedId);
      return {
        ...prev,
        items: filtered,
        total: Math.max(0, prev.total - 1),
      };
    });
  };

  const handlePageChange = (nextPage) => {
    setState((prev) => ({
      ...prev,
      page: nextPage,
    }));
  };

  const handlePerPageChange = (nextPerPage) => {
    setState((prev) => ({
      ...prev,
      perPage: nextPerPage,
      page: 1,
    }));
  };

  return (
    <section className="px-4 py-6 sm:px-6">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Moje oferty</h1>
      </header>

      {state.loading && (
        <p className="mb-3 text-sm text-gray-500">Ładowanie ofert…</p>
      )}

      {state.error && (
        <p className="mb-3 text-sm text-red-600">{state.error}</p>
      )}

      <JobCardList
        jobs={state.items}
        showDelete
        onJobDeleted={handleJobDeleted}
      />

      {state.total > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={state.page}
            perPage={state.perPage}
            totalItems={state.total}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
          />
        </div>
      )}
    </section>
  );
}
