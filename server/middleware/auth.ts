import { Request, Response, NextFunction } from "express";
import { getSupabase } from "../config/supabase.js";
import { getBearerToken } from "../utils/helpers.js";
import { AuthenticatedRequest } from "../types/index.js";

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      console.error(`[Auth] No token for ${req.method} ${req.path}`);
      return res.status(401).json({ error: "Unauthorized - No token" });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      console.error(`[Auth] Invalid token for ${req.method} ${req.path}:`, error?.message || "No user");
      return res.status(401).json({ error: "Invalid token", details: error?.message });
    }

    const userId = data.user.id;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return res.status(500).json({ error: "Server error fetching profile" });
    }

    req.authUser = {
      id: userId,
      email: data.user.email,
    };
    req.authProfile = profile;

    next();
  } catch (err: any) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({ error: "Authentication failed" });
  }
};

export const checkAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const isAdmin = req.authProfile?.role === "admin";
  if (!isAdmin) {
    console.error(`[Admin] Access denied for ${req.authUser?.email || "unknown"}, role: ${req.authProfile?.role || "none"}`);
    return res.status(403).json({ error: "Forbidden - Admin only" });
  }
  console.log(`[Admin] Access granted for ${req.authUser?.email}`);
  next();
};
