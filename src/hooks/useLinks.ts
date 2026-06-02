import { useState, useCallback, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { UserProfile, ConvertedLink, LinkUpdatePayload } from "@/src/types";
import { toast } from "sonner";
import { useLocale } from "@/src/hooks/useLocale";
import { supabase } from "@/src/lib/supabase";

interface UseLinksProps {
  user: User | null;
  profile: UserProfile | null;
  currentWorkspaceId?: string;
  workspaceResolved?: boolean;
  fetchWithAuth: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
  activeTab: string;
}

export interface LinksState {
  links: ConvertedLink[];
  listLoading: boolean;
  linksDirty: boolean;
  searchTerm: string;
}

export interface LinksActions {
  setSearchTerm: (v: string) => void;
  setLinksDirty: (v: boolean) => void;
  upsertLink: (link: ConvertedLink) => void;
  fetchLinks: () => Promise<void>;
  handleDeleteLink: (id: string) => Promise<void>;
  handleUpdateLink: (id: string, data: LinkUpdatePayload) => Promise<void>;
  handleShareLink: (id: string, workspaceId: string) => Promise<void>;
  handleDeleteManyLinks: (ids: string[]) => Promise<void>;
  refreshLinks: () => void;
}

export function useLinks({
  user,
  profile,
  currentWorkspaceId,
  workspaceResolved = false,
  fetchWithAuth,
  activeTab,
}: UseLinksProps): LinksState & LinksActions {
  const { t } = useLocale();
  const [links, setLinks] = useState<ConvertedLink[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [linksDirty, setLinksDirty] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const linksRequestSeqRef = useRef(0);

  const upsertLink = useCallback((link: ConvertedLink) => {
    setLinks((current) => {
      const nextId = link.id || "";
      const nextShortCode = link.short_code;
      const filtered = current.filter(
        (item) =>
          (nextId && item.id !== nextId) || (!nextId && item.short_code !== nextShortCode),
      );
      return [link, ...filtered];
    });
  }, []);

  const fetchLinks = useCallback(async () => {
    if (!user) return;
    const requestSeq = ++linksRequestSeqRef.current;
    setListLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentWorkspaceId) {
        params.set("workspaceId", currentWorkspaceId);
      }
      params.set("_ts", String(Date.now()));
      const query = `?${params.toString()}`;

      const response = await fetchWithAuth(`/api/v1/user/links${query}`);
      const data = await response.json();
      if (requestSeq !== linksRequestSeqRef.current) {
        return;
      }
      setLinks(data);
      setLinksDirty(false);
    } catch (e) {
      if (requestSeq !== linksRequestSeqRef.current) {
        return;
      }
      console.error(e);
    } finally {
      if (requestSeq === linksRequestSeqRef.current) {
        setListLoading(false);
      }
    }
  }, [user, fetchWithAuth, currentWorkspaceId]);

  const handleDeleteLink = useCallback(
    async (id: string) => {
      try {
        const res = await fetchWithAuth(`/api/v1/user/links/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Delete failed");
        setLinks((prev) => prev.filter((l) => l.id !== id));
        setLinksDirty(false);
        toast.success("Đã xóa link thành công!");
      } catch (e: any) {
        toast.error("Lỗi khi xóa link: " + e.message);
      }
    },
    [fetchWithAuth],
  );

  const handleUpdateLink = useCallback(
    async (id: string, data: LinkUpdatePayload) => {
      try {
        const res = await fetchWithAuth(`/api/v1/user/links/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Update failed");
        const updated = payload;
        setLinks((prev) =>
          prev.map((l) => (l.id === id ? { ...l, ...updated } : l)),
        );
        setLinksDirty(false);
        toast.success("Đã cập nhật link thành công!");
      } catch (e: any) {
        toast.error("Lỗi khi cập nhật link: " + e.message);
      }
    },
    [fetchWithAuth],
  );

  const handleShareLink = useCallback(
    async (id: string, workspaceId: string) => {
      try {
        const res = await fetchWithAuth(`/api/v1/user/links/${id}/share`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Share failed");
        }
        setLinksDirty(true);
        toast.success(t("linkListShare.success"));
      } catch (e: any) {
        toast.error(
          `${t("linkListShare.errorPrefix")}${
            e?.message ? `: ${e.message}` : ""
          }`,
        );
      }
    },
    [fetchWithAuth, t],
  );

  const handleDeleteManyLinks = useCallback(
    async (ids: string[]) => {
      try {
        const res = await fetchWithAuth("/api/v1/user/links/bulk-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        if (!res.ok) throw new Error("Bulk delete failed");
        const result = await res.json();
        setLinks((prev) => prev.filter((l) => l.id && !ids.includes(l.id)));
        setLinksDirty(false);
        toast.success(
          `Đã xóa ${result.deleted || ids.length} link thành công!`,
        );
      } catch (e: any) {
        toast.error("Lỗi khi xóa link: " + e.message);
      }
    },
    [fetchWithAuth],
  );

  const refreshLinks = useCallback(() => {
    setLinksDirty(true);
  }, []);

  useEffect(() => {
    setLinks([]);
    setSearchTerm("");
    setListLoading(false);
    setLinksDirty(!!user);
  }, [user?.id, currentWorkspaceId]);

  useEffect(() => {
    if (!user?.id || !currentWorkspaceId) return;

    const channel = supabase
      .channel(`links-sync:${user.id}:${currentWorkspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "links",
          filter: `workspace_id=eq.${currentWorkspaceId}`,
        },
        () => {
          setLinksDirty(true);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentWorkspaceId, user?.id]);

  // Auto-fetch when tab is list and data is dirty
  useEffect(() => {
    const isAdminRole = profile?.role === "admin";
    const isApproved = profile?.status === "approved" || isAdminRole;

    if (
      user &&
      workspaceResolved &&
      isApproved &&
      activeTab === "list" &&
      (linksDirty || links.length === 0)
    ) {
      fetchLinks();
    }
  }, [
    user,
    profile,
    workspaceResolved,
    activeTab,
    linksDirty,
    links.length,
    fetchLinks,
  ]);

  return {
    links,
    listLoading,
    linksDirty,
    searchTerm,
    setSearchTerm,
    setLinksDirty,
    upsertLink,
    fetchLinks,
    handleDeleteLink,
    handleUpdateLink,
    handleShareLink,
    handleDeleteManyLinks,
    refreshLinks,
  };
}
