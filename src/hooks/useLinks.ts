import { useState, useCallback, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/src/types";
import { ConvertedLink } from "@/src/types";
import { toast } from "sonner";

interface UseLinksProps {
  user: User | null;
  profile: UserProfile | null;
  fetchWithAuth: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
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
  fetchLinks: () => Promise<void>;
  handleDeleteLink: (id: string) => Promise<void>;
  handleUpdateLink: (id: string, data: Partial<ConvertedLink>) => Promise<void>;
  refreshLinks: () => void;
}

export function useLinks({ user, profile, fetchWithAuth, activeTab }: UseLinksProps): LinksState & LinksActions {
  const [links, setLinks] = useState<ConvertedLink[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [linksDirty, setLinksDirty] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLinks = useCallback(async () => {
    if (!user) return;
    setListLoading(true);
    try {
      const response = await fetchWithAuth("/api/v1/user/links");
      const data = await response.json();
      setLinks(data);
      setLinksDirty(false);
    } catch (e) {
      console.error(e);
    } finally {
      setListLoading(false);
    }
  }, [user, fetchWithAuth]);

  const handleDeleteLink = useCallback(async (id: string) => {
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
  }, [fetchWithAuth]);

  const handleUpdateLink = useCallback(async (id: string, data: Partial<ConvertedLink>) => {
    try {
      const res = await fetchWithAuth(`/api/v1/user/links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      setLinks((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...updated } : l)),
      );
      setLinksDirty(false);
      toast.success("Đã cập nhật link thành công!");
    } catch (e: any) {
      toast.error("Lỗi khi cập nhật link: " + e.message);
    }
  }, [fetchWithAuth]);

  const refreshLinks = useCallback(() => {
    setLinksDirty(true);
  }, []);

  // Auto-fetch when tab is list and data is dirty
  useEffect(() => {
    const isAdminRole = profile?.role === "admin" || user?.email === "devluan1996@gmail.com";
    const isApproved = profile?.status === "approved" || isAdminRole;

    if (user && isApproved && activeTab === "list" && (linksDirty || links.length === 0)) {
      fetchLinks();
    }
  }, [user, profile, activeTab, linksDirty, links.length, fetchLinks]);

  return {
    links,
    listLoading,
    linksDirty,
    searchTerm,
    setSearchTerm,
    setLinksDirty,
    fetchLinks,
    handleDeleteLink,
    handleUpdateLink,
    refreshLinks,
  };
}
