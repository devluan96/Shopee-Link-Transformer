import { UAParser } from "ua-parser-js";
import { isPrivateOrLocalIp, normalizeClientIp } from "./helpers.js";

export interface DeviceInfo {
  deviceType: string;
  browser: string;
  os: string;
  deviceBrand?: string;
}

export const parseDeviceInfo = (userAgent: string): DeviceInfo => {
  if (!userAgent) {
    return {
      deviceType: "unknown",
      browser: "unknown",
      os: "unknown",
    };
  }

  try {
    const parser = new UAParser(userAgent);
    const device = parser.getDevice();
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const engine = parser.getEngine();

    // Determine device type
    let deviceType = "desktop";
    if (device.type) {
      deviceType = device.type; // mobile, tablet, wearable, console, etc.
    } else if (/mobile|android.*mobile|iphone|ipod/i.test(userAgent)) {
      deviceType = "mobile";
    } else if (/tablet|ipad|android(?!.*mobile)/i.test(userAgent)) {
      deviceType = "tablet";
    }

    // Check for bots
    if (/bot|crawler|spider|scrape|googlebot|bingbot/i.test(userAgent)) {
      deviceType = "bot";
    }

    // Get browser name
    let browserName = browser.name || "unknown";
    if (browser.version) {
      browserName = `${browser.name} ${browser.version.split(".")[0]}`;
    }

    // Get OS name
    let osName = os.name || "unknown";
    if (os.version) {
      osName = `${os.name} ${os.version.split(".")[0]}`;
    }

    return {
      deviceType,
      browser: browserName,
      os: osName,
      deviceBrand: device.vendor || undefined,
    };
  } catch (error) {
    console.error("Error parsing user agent:", error);
    return {
      deviceType: "unknown",
      browser: "unknown",
      os: "unknown",
    };
  }
};

// Simple IP geolocation using free API
export interface GeoInfo {
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
  timezone?: string;
  lat?: number;
  lon?: number;
}

// Cache for IP geolocation to avoid repeated API calls
const geoCache = new Map<string, GeoInfo>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export const getGeoInfo = async (ip: string): Promise<GeoInfo | null> => {
  const normalizedIp = normalizeClientIp(ip);

  // Skip for localhost/private IPs
  if (!normalizedIp || isPrivateOrLocalIp(normalizedIp)) {
    return null;
  }

  // Check cache
  const cached = geoCache.get(normalizedIp);
  if (cached) {
    return cached;
  }

  const providers: Array<() => Promise<GeoInfo | null>> = [
    async () => {
      const response = await fetch(`https://ipapi.co/${normalizedIp}/json/`, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AnalyticsBot/1.0)" },
        signal: AbortSignal.timeout(2500),
      });

      if (!response.ok) {
        throw new Error(`ipapi.co HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.reason || "ipapi.co lookup failed");
      }

      return {
        country: data.country_name,
        countryCode: data.country_code,
        city: data.city,
        region: data.region,
        timezone: data.timezone,
        lat: data.latitude,
        lon: data.longitude,
      };
    },
    async () => {
      const response = await fetch(`https://ipwho.is/${normalizedIp}`, {
        signal: AbortSignal.timeout(2500),
      });

      if (!response.ok) {
        throw new Error(`ipwho.is HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success === false) {
        throw new Error(data.message || "ipwho.is lookup failed");
      }

      return {
        country: data.country,
        countryCode: data.country_code,
        city: data.city,
        region: data.region,
        timezone: data.timezone?.id,
        lat: data.latitude,
        lon: data.longitude,
      };
    },
    async () =>
      getGeoInfoIpInfo(normalizedIp, process.env.IPINFO_TOKEN || process.env.IPINFO_API_TOKEN),
  ];

  for (const provider of providers) {
    try {
      const geoInfo = await provider();
      if (!geoInfo?.country && !geoInfo?.city) {
        continue;
      }

      geoCache.set(normalizedIp, geoInfo);
      setTimeout(() => geoCache.delete(normalizedIp), CACHE_TTL);
      return geoInfo;
    } catch (error) {
      console.warn("Geo provider failed for IP:", normalizedIp, error);
    }
  }

  console.error("Error getting geo info for IP:", normalizedIp);
  return null;
};

// Alternative: Using ipinfo.io (requires token for production)
export const getGeoInfoIpInfo = async (ip: string, token?: string): Promise<GeoInfo | null> => {
  const normalizedIp = normalizeClientIp(ip);
  if (!normalizedIp || isPrivateOrLocalIp(normalizedIp)) {
    return null;
  }

  try {
    const url = token 
      ? `https://ipinfo.io/${normalizedIp}?token=${token}`
      : `https://ipinfo.io/${normalizedIp}/json`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(2500),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      country: data.country,
      countryCode: data.country,
      city: data.city,
      region: data.region,
      timezone: data.timezone,
    };
  } catch (error) {
    console.error("Error getting geo info from ipinfo:", error);
    return null;
  }
};
