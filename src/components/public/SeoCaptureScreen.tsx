import React, { useRef, useState } from "react";
import { Analytics } from "@/src/components/dashboard/Analytics";
import { InstallCenter } from "@/src/components/InstallCenter";
import { CreateLink } from "@/src/components/links/CreateLink";
import { LinkList } from "@/src/components/links/LinkList";
import { Pricing } from "@/src/components/Pricing";
import type {
  AnalyticsData,
  ConvertedLink,
  LinkQuota,
  Tab,
  UserLimits,
  UserProfile,
  Workspace,
} from "@/src/types";

type CaptureScreen =
  | "create"
  | "create-tiktok"
  | "pricing"
  | "install"
  | "analytics"
  | "library";

const mockQuota: LinkQuota = {
  plan: "yearly",
  dailyLimit: null,
  usedToday: 12,
  remainingToday: null,
  canCreate: true,
};

const mockLimits: UserLimits = {
  plan: "yearly",
  canUseAbTesting: true,
  dailyVideoUploads: null,
  videoUploadsUsedToday: 3,
  videoUploadsRemainingToday: null,
  maxTeamWorkspaces: 5,
  ownedTeamWorkspaces: 2,
  teamWorkspacesRemaining: 3,
  maxTeamMembersPerWorkspace: 8,
};

const mockProfile: UserProfile = {
  id: "8f8e8d8c-1111-2222-3333-444455556666",
  email: "ops@hotsnew.click",
  full_name: "HotsNew Ops",
  subscription_plan: "yearly",
  subscription_expiry: "2027-12-31T00:00:00.000Z",
};

const mockAnalytics: AnalyticsData = {
  history: [
    { date: "2026-05-08", clicks: 120 },
    { date: "2026-05-09", clicks: 148 },
    { date: "2026-05-10", clicks: 164 },
    { date: "2026-05-11", clicks: 182 },
    { date: "2026-05-12", clicks: 196 },
    { date: "2026-05-13", clicks: 214 },
    { date: "2026-05-14", clicks: 238 },
  ],
  topLinks: [
    {
      id: "lnk-1",
      short_code: "sale-shopee",
      slug: "landing-page-shopee-moi-ngay",
      title: "Landing Shopee mới mỗi ngày",
      clicks: 824,
    },
    {
      id: "lnk-2",
      short_code: "bio-tiktok",
      slug: "link-bio-tiktok-aff",
      title: "Link bio TikTok affiliate",
      clicks: 612,
    },
    {
      id: "lnk-3",
      short_code: "mega-sale",
      slug: "rut-gon-link-mega-sale",
      title: "Rút gọn link campaign Mega Sale",
      clicks: 488,
    },
  ],
  trafficSources: [
    { name: "Facebook Group", value: 34 },
    { name: "TikTok Bio", value: 28 },
    { name: "Comment Seeding", value: 18 },
    { name: "Zalo", value: 12 },
    { name: "Khác", value: 8 },
  ],
  growthPercentage: 18.4,
  totalShopeeClicks: 1384,
  totalTiktokClicks: 1066,
};

const mockLinks: ConvertedLink[] = [
  {
    id: "link-1",
    short_code: "flash-sale",
    slug: "landing-page-shopee-flash-sale",
    original_url: "https://shopee.vn/product/123/456",
    converted_url: "https://hotsnew.click/landing-page-shopee-flash-sale",
    custom_title: "Landing Shopee Flash Sale",
    custom_description: "Preview đẹp hơn cho post Facebook và group seeding.",
    custom_image_url: "/og-image.png",
    created_at: "2026-05-14T08:00:00.000Z",
    user_id: "user-1",
    clicks: 824,
    tiktok_clicks: 214,
    usage_context: "Bài viết Facebook",
    folder_name: "Shopee",
    tags: ["flash-sale", "facebook"],
    redirect_delay_ms: 2500,
  },
  {
    id: "link-2",
    short_code: "tiktok-bio",
    slug: "link-bio-tiktok-affiliate",
    original_url: "https://www.tiktok.com/@shop/video/1234567890",
    converted_url: "https://hotsnew.click/link-bio-tiktok-affiliate",
    custom_title: "Link bio TikTok affiliate",
    custom_description: "Route bio dùng cho creator và tracking theo chiến dịch.",
    custom_image_url: "/og-image.png",
    created_at: "2026-05-13T10:00:00.000Z",
    user_id: "user-1",
    clicks: 612,
    tiktok_clicks: 612,
    usage_context: "Bio TikTok",
    folder_name: "TikTok",
    tags: ["bio", "creator"],
    redirect_delay_ms: 2000,
  },
  {
    id: "link-3",
    short_code: "video-preview",
    slug: "tracking-click-affiliate-demo",
    original_url: "https://shopee.vn/product/888/999",
    converted_url: "https://hotsnew.click/tracking-click-affiliate-demo",
    custom_title: "Tracking click affiliate",
    custom_description: "Gom UTM, route và nguồn traffic trong một link.",
    custom_image_url: "/og-image.png",
    video_url: "https://res.cloudinary.com/demo/video/upload/sample.mp4",
    created_at: "2026-05-12T12:00:00.000Z",
    user_id: "user-1",
    clicks: 488,
    tiktok_clicks: 132,
    usage_context: "Reel Facebook",
    folder_name: "Tracking",
    tags: ["utm", "affiliate"],
    redirect_delay_ms: 3000,
  },
];

const mockWorkspaces: Workspace[] = [
  {
    id: "ws-main",
    owner_id: "user-1",
    name: "HotsNew Click",
    slug: "hotsnew-click",
    is_personal: false,
    role: "owner",
  },
  {
    id: "ws-growth",
    owner_id: "user-1",
    name: "Growth Team",
    slug: "growth-team",
    is_personal: false,
    role: "editor",
  },
];

const mockFetchWithAuth = async () =>
  new Response(JSON.stringify([]), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

export function SeoCaptureScreen({ screen }: { screen: CaptureScreen }) {
  const isTikTok = screen === "create-tiktok";
  const [activeTab, setActiveTab] = useState<Tab>("create");
  const [url, setUrl] = useState(
    isTikTok
      ? "https://www.tiktok.com/@hotsnew/video/7483920192"
      : "https://shopee.vn/product/123/456",
  );
  const [mobileDirectMode, setMobileDirectMode] = useState(false);
  const [customTitle, setCustomTitle] = useState(
    isTikTok
      ? "Link bio TikTok affiliate cho creator"
      : "Landing page Shopee Flash Sale đẹp hơn",
  );
  const [customDescription, setCustomDescription] = useState(
    isTikTok
      ? "Gắn bio, giữ preview rõ và đo click theo creator."
      : "Điều hướng traffic Facebook và group seeding qua một route gọn hơn.",
  );
  const [customShortCode, setCustomShortCode] = useState(
    isTikTok ? "link-bio-tiktok-aff" : "landing-page-shopee-flash-sale",
  );
  const [usageContext, setUsageContext] = useState(
    isTikTok ? "Bio TikTok" : "Bài viết Facebook",
  );
  const [folderName, setFolderName] = useState(isTikTok ? "TikTok" : "Shopee");
  const [tagsText, setTagsText] = useState(
    isTikTok ? "creator,bio,affiliate" : "flash-sale,facebook,seeding",
  );
  const [customImageUrl, setCustomImageUrl] = useState("/og-image.png");
  const [customDomain, setCustomDomain] = useState(
    isTikTok ? "new-express.xyz" : "hotsnew.click",
  );
  const [shopeeAffiliateParams, setShopeeAffiliateParams] = useState("sub_id=flashsale");
  const [tiktokAffiliateParams, setTiktokAffiliateParams] = useState("utm_id=creator-a");
  const [secondaryUrl, setSecondaryUrl] = useState("");
  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const [abVariantBTitle, setAbVariantBTitle] = useState("");
  const [abVariantBDescription, setAbVariantBDescription] = useState("");
  const [abVariantBImageUrl, setAbVariantBImageUrl] = useState("");
  const [abVariantBVideoUrl, setAbVariantBVideoUrl] = useState("");
  const [abVariantBOriginalUrl, setAbVariantBOriginalUrl] = useState("");
  const [abVariantBSecondaryUrl, setAbVariantBSecondaryUrl] = useState("");
  const [secondaryTargetType, setSecondaryTargetType] = useState<
    "shopee" | "tiktok"
  >(isTikTok ? "tiktok" : "shopee");
  const [redirectDelayMs, setRedirectDelayMs] = useState(2500);
  const [expiresAt, setExpiresAt] = useState("2026-12-31T23:59");
  const [videoUrl, setVideoUrl] = useState(
    "https://res.cloudinary.com/demo/video/upload/sample.mp4",
  );
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

  if (screen === "pricing") {
    return (
      <CaptureFrame>
        <Pricing
          userProfile={mockProfile}
          linkQuota={mockQuota}
          userLimits={mockLimits}
          fetchWithAuth={mockFetchWithAuth}
        />
      </CaptureFrame>
    );
  }

  if (screen === "install") {
    return (
      <CaptureFrame>
        <InstallCenter />
      </CaptureFrame>
    );
  }

  if (screen === "analytics") {
    return (
      <CaptureFrame>
        <Analytics
          analyticsData={mockAnalytics}
          linksCount={mockLinks.length}
          fetchWithAuth={mockFetchWithAuth}
          currentWorkspaceId="ws-main"
        />
      </CaptureFrame>
    );
  }

  if (screen === "library") {
    return (
      <CaptureFrame>
        <LinkList
          links={mockLinks}
          listLoading={false}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          workspaces={mockWorkspaces}
          currentWorkspaceId="ws-main"
          canShareToWorkspace
          copyToClipboard={() => {}}
          copiedId=""
          onDeleteLink={async () => {}}
          onUpdateLink={async () => {}}
          onShareLink={async () => {}}
        />
      </CaptureFrame>
    );
  }

  return (
    <CaptureFrame>
      <CreateLink
        url={url}
        setUrl={setUrl}
        mobileDirectMode={mobileDirectMode}
        setMobileDirectMode={setMobileDirectMode}
        customTitle={customTitle}
        setCustomTitle={setCustomTitle}
        customDescription={customDescription}
        setCustomDescription={setCustomDescription}
        customShortCode={customShortCode}
        setCustomShortCode={setCustomShortCode}
        usageContext={usageContext}
        setUsageContext={setUsageContext}
        folderName={folderName}
        setFolderName={setFolderName}
        tagsText={tagsText}
        setTagsText={setTagsText}
        customImageUrl={customImageUrl}
        setCustomImageUrl={setCustomImageUrl}
        customDomain={customDomain}
        setCustomDomain={setCustomDomain}
        availableOutputDomains={["hotsnew.click", "new-express.xyz", "vn-express.cloud"]}
        canUseCustomDomains
        linkQuota={mockQuota}
        userLimits={mockLimits}
        shopeeAffiliateParams={shopeeAffiliateParams}
        setShopeeAffiliateParams={setShopeeAffiliateParams}
        tiktokAffiliateParams={tiktokAffiliateParams}
        setTiktokAffiliateParams={setTiktokAffiliateParams}
        secondaryUrl={secondaryUrl}
        setSecondaryUrl={setSecondaryUrl}
        abTestEnabled={abTestEnabled}
        setAbTestEnabled={setAbTestEnabled}
        abVariantBTitle={abVariantBTitle}
        setAbVariantBTitle={setAbVariantBTitle}
        abVariantBDescription={abVariantBDescription}
        setAbVariantBDescription={setAbVariantBDescription}
        abVariantBImageUrl={abVariantBImageUrl}
        setAbVariantBImageUrl={setAbVariantBImageUrl}
        abVariantBVideoUrl={abVariantBVideoUrl}
        setAbVariantBVideoUrl={setAbVariantBVideoUrl}
        abVariantBOriginalUrl={abVariantBOriginalUrl}
        setAbVariantBOriginalUrl={setAbVariantBOriginalUrl}
        abVariantBSecondaryUrl={abVariantBSecondaryUrl}
        setAbVariantBSecondaryUrl={setAbVariantBSecondaryUrl}
        secondaryTargetType={secondaryTargetType}
        setSecondaryTargetType={setSecondaryTargetType}
        redirectDelayMs={redirectDelayMs}
        setRedirectDelayMs={setRedirectDelayMs}
        expiresAt={expiresAt}
        setExpiresAt={setExpiresAt}
        videoUrl={videoUrl}
        setVideoUrl={setVideoUrl}
        uploadingVideo={false}
        videoUploadProgress={0}
        videoUploadSuccess={false}
        videoUploadProvider={null}
        videoInputRef={videoInputRef}
        handleVideoUpload={() => {}}
        handleVideoFileUpload={async () => {}}
        thumbnailInputRef={thumbnailInputRef}
        uploadingThumbnail={false}
        thumbnailUploadProgress={0}
        thumbnailUploadSuccess={false}
        thumbnailUploadProvider={null}
        handleThumbnailUpload={async () => {}}
        handleThumbnailFileUpload={async () => {}}
        handleConvert={(event) => event.preventDefault()}
        loading={false}
        error={error}
        setError={setError}
        result={{
          short_code: isTikTok ? "link-bio-tiktok-aff" : "flash-sale",
          slug: isTikTok ? "link-bio-tiktok-affiliate" : "landing-page-shopee-flash-sale",
          converted_url: isTikTok
            ? "https://new-express.xyz/link-bio-tiktok-affiliate"
            : "https://hotsnew.click/landing-page-shopee-flash-sale",
        }}
        copyToClipboard={() => {}}
        copiedId=""
        setActiveTab={setActiveTab}
        guideDialogOpen={false}
        onOpenGuide={() => {}}
        onCloseGuide={() => {}}
      />
    </CaptureFrame>
  );
}

function CaptureFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#f4efe8] p-6">
      <div className="mx-auto max-w-[1500px] rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.35)]">
        {children}
      </div>
    </div>
  );
}
