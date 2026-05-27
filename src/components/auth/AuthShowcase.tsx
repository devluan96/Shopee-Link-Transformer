import {
  Check,
  ArrowRight,
  Bot,
  ChartNoAxesCombined,
  FileText,
  Image,
  Link2,
  MonitorSmartphone,
  House,
  Play,
  QrCode,
  Send,
  ShieldCheck,
  Users2,
  Workflow,
} from "lucide-react";
import { motion } from "motion/react";
import { useLocale } from "@/src/hooks/useLocale";
import { cn } from "@/src/lib/utils";

interface AuthShowcaseProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  tone: "dark" | "light";
}

const sectionMotion = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: "easeOut" as const },
};

export function AuthShowcase({
  onOpenLogin,
  onOpenRegister,
  tone,
}: AuthShowcaseProps) {
  const { locale } = useLocale();
  const isVi = locale === "vi";
  const isLight = tone === "light";

  const copy = isVi
    ? {
        hero: {
          badge: "Mới",
          badgeText: "Preview page và tracking đi cùng một flow",
          title: "Biến link Shopee và TikTok thành flow gọn.",
          highlight: "10x rõ hơn,",
          titleEnd: "trong một workspace.",
          description:
            "HotsNew Click gom link, preview, UTM, QR và analytics vào một workspace gọn cho đội vận hành.",
          primary: "Tạo tài khoản",
          secondary: "Xem demo",
          note: "Không setup phức tạp · Có desktop / PWA",
        },
        demo: {
          title: "Vài màn hình là hiểu app làm gì.",
          description:
            "Flow chính đi từ tạo link sang thư viện và analytics.",
          watch: "Đi tới đăng nhập",
          createTitle: "Tạo link",
          createBody: "Slug, title, QR và tracking nằm cùng một chỗ.",
          libraryTitle: "Thư viện",
          libraryBody: "Link, tag và folder gom lại cho dễ tìm.",
          analyticsTitle: "Analytics",
          analyticsBody: "Xem nhanh link nào đang kéo tốt.",
        },
        aiHub: {
          badge: "AI Hub",
          title: "AI nằm trong luồng tạo link, không đứng ngoài.",
          highlight: "Giữ copy gọn và đều.",
          description:
            "AI giảm việc lặp lại khi viết title, chuẩn hóa UTM và rà flow trước khi publish.",
          cards: [
            {
              title: "Gợi ý title và CTA",
              body: "Tạo nhanh vài bản để team chọn.",
              icon: FileText,
            },
            {
              title: "Chuẩn hóa UTM",
              body: "Giữ naming nhất quán giữa các kênh.",
              icon: Bot,
            },
            {
              title: "Soát preview trước khi publish",
              body: "Nhắc những điểm cần check trước khi lên live.",
              icon: ShieldCheck,
            },
          ],
        },
        proof: {
          summary:
            "12,480+ link · 1,84M+ click · 320+ workspace · 12 domain",
          items: [
            "Shopee campaign",
            "TikTok bio",
            "Facebook group",
            "Zalo route",
            "Creator flow",
            "Team workspace",
          ],
        },
        features: {
          badge: "Flow tính năng",
          highlight: "Một pipeline. Ít tab hơn.",
          stages: [
            { title: "Link gốc", note: "Shopee hoặc TikTok", icon: Link2 },
            { title: "Preview", note: "Ảnh hoặc video", icon: Image },
            { title: "Title", note: "AI hỗ trợ copy", icon: FileText },
            { title: "UTM", note: "Tracking nhất quán", icon: Bot },
            { title: "QR", note: "Xuất mã ngay", icon: QrCode },
            { title: "Publish", note: "Slug đẹp", icon: Send },
            {
              title: "Analytics",
              note: "Click và nguồn",
              icon: ChartNoAxesCombined,
            },
            { title: "Workspace", note: "Team và quyền", icon: Users2 },
          ],
          title:
            "Đủ để chạy campaign, vẫn gọn cho mỗi ngày.",
          description:
            "Rút gọn URL, thêm ngữ cảnh trước click và dữ liệu sau click.",
          cards: [
            {
              title: "Preview flow 2 bước",
              body: "Chèn ảnh hoặc video trước khi sang sàn.",
              icon: Workflow,
            },
            {
              title: "AI hỗ trợ title và UTM",
              body: "Gợi ý title và giữ tracking đều hơn.",
              icon: Bot,
            },
            {
              title: "Workspace và quyền hạn",
              body: "Phân quyền, duyệt truy cập, 2FA cho team.",
              icon: Users2,
            },
          ],
        },
        workflow: {
          title: "Flow ngắn, nhìn là nắm được.",
          steps: [
            {
              id: "01",
              title: "Dán link, đặt slug, xuất QR",
              detail: "Mọi thứ ở một điểm nhập liệu.",
            },
            {
              id: "02",
              title: "Mở preview page khi cần dẫn dắt",
              detail: "Người xem đi qua media và CTA trước khi sang đích.",
            },
            {
              id: "03",
              title: "Quay về dashboard để đọc traffic",
              detail: "Kết quả quay về cùng một màn analytics.",
            },
          ],
        },
        pricing: {
          badge: "Bảng giá",
          title: "Giá đơn giản.",
          highlight: "Mở rộng theo nhịp team.",
          description:
            "Bắt đầu bằng gói free, rồi nâng lên khi cần thêm không gian và traffic.",
          plans: [
            {
              tier: "free" as const,
              name: "HotsNew Free",
              badge: "Khởi động",
              price: "0đ",
              summary:
                "Dành cho người muốn thử flow.",
              meta: "3 link/ngày · 1 video/ngày · 1 workspace",
              cta: "Dùng miễn phí",
              action: "register" as const,
              features: [
                "Tạo link cơ bản để vận hành nhanh",
                "Xem preview page trước khi chèn sang trang đích",
                "Theo dõi click cơ bản cho từng liên kết",
              ],
            },
            {
              tier: "pro" as const,
              name: "Pro",
              badge: "Phổ biến nhất",
              price: "149.000đ",
              period: "/ tháng",
              summary:
                "Cho creator và team nhỏ chạy link đều mỗi ngày.",
              meta: "10 link/ngày · 10 video/ngày",
              cta: "Bắt đầu dùng thử",
              action: "register" as const,
              featured: true,
              features: [
                "1 workspace với tối đa 3 thành viên",
                "Quản lý link, ảnh/video và preview page trong cùng một flow",
                "QR và analytics cơ bản cho từng link",
                "Phù hợp chiến dịch ngắn hạn và team gọn",
              ],
            },
            {
              tier: "business" as const,
              name: "Business",
              badge: "Cho đội vận hành",
              price: "1.430.400đ",
              previousPrice: "1.788.000đ",
              period: "/ năm",
              summary:
                "Phù hợp đội growth và affiliate cần vận hành dài hạn.",
              meta: "30 link/ngày · 30 video/ngày",
              cta: "Tạo workspace",
              action: "register" as const,
              features: [
                "5 workspace với tối đa 20 thành viên",
                "A/B testing và domain đầu ra riêng cho campaign",
                "Theo dõi nhiều route hơn cho team vận hành lớn",
                "Tiết kiệm hơn so với thanh toán 12 tháng rời",
              ],
            },
          ],
        },
        install: {
          eyebrow: "Cài đặt",
          title: "Mở trên web hoặc cài thành app riêng.",
          description:
            "Dùng ngay trên trình duyệt, hoặc cài lên desktop để mở nhanh hơn.",
          quickItems: [
            {
              title: "Web / PWA",
              detail: "Mở ngay trên trình duyệt.",
              icon: MonitorSmartphone,
            },
            {
              title: "Desktop",
              detail: "Cửa sổ riêng để thao tác.",
              icon: House,
            },
            {
              title: "Teams",
              detail: "Cùng dùng chung cho cả đội.",
              icon: ShieldCheck,
            },
          ],
          items: [
            {
              title: "Short link có cấu trúc",
              detail: "Slug đẹp, title rõ, dễ quản lý lại.",
              icon: Link2,
            },
            {
              title: "Desktop hoặc PWA",
              detail: "Mở nhanh và dùng như app riêng.",
              icon: MonitorSmartphone,
            },
            {
              title: "Bảo mật và truy cập",
              detail: "Khôi phục mật khẩu và 2FA cho team.",
              icon: ShieldCheck,
            },
            {
              title: "Analytics để ra quyết định",
              detail: "Nhìn top link và kênh hiệu quả nhanh hơn.",
              icon: ChartNoAxesCombined,
            },
          ],
          primary: "Tạo tài khoản mới",
          secondary: "Đăng nhập ngay",
        },
        cta: {
          title: "Đừng xoay qua nhiều công cụ.",
          highlight: "Bắt đầu chạy trong một flow.",
          description:
            "Tạo workspace trong vài phút. Không cần setup phức tạp.",
          primary: "Tạo tài khoản",
          secondary: "Đăng nhập",
          trust: [
            { label: "QR và preview page trong một flow", icon: QrCode },
            {
              label: "Workspace cho team và quyền truy cập rõ",
              icon: ShieldCheck,
            },
            {
              label: "Analytics đủ nhanh để tối ưu",
              icon: ChartNoAxesCombined,
            },
          ],
        },
        changelog: {
          badge: "Changelog",
          title: "Cập nhật nhỏ, đúng việc dùng hằng ngày.",
          highlight: "Ship đều để đỡ vướng.",
          description:
            "Tập trung vào tạo link nhanh hơn, rõ hơn và ít sai sót hơn.",
          items: [
            {
              version: "v2.6",
              date: "Tháng 5 2026",
              title: "Thêm AI support cho title và UTM",
              body: "Lên title và chuẩn hóa tracking nhanh hơn.",
            },
            {
              version: "v2.5",
              date: "Tháng 4 2026",
              title: "Preview page và QR đi chung một flow",
              body: "Không cần tách nhiều bước khi dựng page và xuất mã.",
            },
            {
              version: "v2.4",
              date: "Tháng 3 2026",
              title: "Analytics trả về nhanh hơn trên dashboard",
              body: "Click, route và nguồn traffic quay lại sớm hơn.",
            },
          ],
        },
        footer: {
          description:
            "Workspace cho link, preview page, QR và analytics của đội vận hành.",
          columns: [
            {
              title: "Sản phẩm",
              links: [
                { label: "Flow tính năng", href: "#showcase-features" },
                { label: "Trung tâm vận hành", href: "#showcase-story" },
                { label: "Bảng giá", href: "#showcase-pricing" },
                { label: "Cài đặt nhanh", href: "#showcase-install" },
              ],
            },
            {
              title: "Khả năng",
              links: [
                { label: "Preview page", href: "#showcase-demo" },
                { label: "QR và tracking", href: "#showcase-features" },
                { label: "Workspace và team", href: "#showcase-story" },
                { label: "Desktop / PWA", href: "#showcase-install" },
              ],
            },
            {
              title: "Bắt đầu",
              links: [
                { label: "Tạo tài khoản", href: "#showcase-pricing" },
                { label: "Đăng nhập", href: "#showcase-demo" },
                { label: "Xem flow tạo link", href: "#showcase-demo" },
                { label: "Chọn gói phù hợp", href: "#showcase-pricing" },
              ],
            },
            {
              title: "Vận hành",
              links: [
                { label: "Tag và folder", href: "#showcase-demo" },
                { label: "Domain đầu ra", href: "#showcase-story" },
                { label: "Analytics click", href: "#showcase-story" },
                { label: "Quyền truy cập", href: "#showcase-install" },
              ],
            },
          ],
          copyright:
            "© 2026 HotsNew Click. Build để vận hành link gọn và rõ hơn.",
        },
      }
    : {
        hero: {
          badge: "New",
          badgeText: "Preview pages and tracking in one flow",
          title: "Turn Shopee and TikTok links into a cleaner flow.",
          highlight: "10x faster,",
          titleEnd: "from one workspace.",
          description:
            "HotsNew Click keeps links, preview, UTM, QR, and analytics in one place.",
          primary: "Start free",
          secondary: "Watch the demo",
          note: "No complex setup · Desktop and PWA ready",
        },
        demo: {
          title: "A few screens explain the product.",
          description:
            "The main flow moves from creation to library to analytics.",
          watch: "Go to login",
          createTitle: "Link creation",
          createBody: "Slug, title, QR, and tracking in one flow.",
          libraryTitle: "Library",
          libraryBody: "Links, tags, and folders stay easy to scan.",
          analyticsTitle: "Analytics",
          analyticsBody: "See which links and channels need attention.",
        },
        aiHub: {
          badge: "AI Hub",
          title: "AI sits inside link operations.",
          highlight: "Keep copy clean and consistent.",
          description:
            "AI cuts repetitive work when drafting titles, normalizing UTM naming, and checking the flow before publish.",
          cards: [
            {
              title: "Title and CTA suggestions",
              body: "Generate a few fast options per campaign.",
              icon: FileText,
            },
            {
              title: "UTM normalization",
              body: "Keep naming cleaner across channels.",
              icon: Bot,
            },
            {
              title: "Pre-publish checks",
              body: "Review media, slug, and tracking before go-live.",
              icon: ShieldCheck,
            },
          ],
        },
        proof: {
          summary:
            "12,480+ links · 1.84M+ clicks · 320+ workspaces · 12 domains",
          items: [
            "Shopee campaign",
            "TikTok bio",
            "Facebook group",
            "Zalo route",
            "Creator flow",
            "Team workspace",
          ],
        },
        features: {
          badge: "The pipeline",
          highlight: "One pipeline. Fewer tabs.",
          stages: [
            { title: "Source link", note: "Shopee or TikTok", icon: Link2 },
            { title: "Preview", note: "Image or video", icon: Image },
            { title: "Title", note: "AI-assisted copy", icon: FileText },
            { title: "UTM", note: "Clean tracking", icon: Bot },
            { title: "QR", note: "Instant export", icon: QrCode },
            { title: "Publish", note: "Clean slug", icon: Send },
            {
              title: "Analytics",
              note: "Clicks and sources",
              icon: ChartNoAxesCombined,
            },
            { title: "Workspace", note: "Team and access", icon: Users2 },
          ],
          title:
            "Enough to run campaigns, still simple every day.",
          description:
            "The product adds context before the click and signal after it.",
          cards: [
            {
              title: "Two-step preview flow",
              body: "Insert image or video before visitors leave.",
              icon: Workflow,
            },
            {
              title: "AI support for titles and UTM",
              body: "Keep titles and tracking cleaner across the team.",
              icon: Bot,
            },
            {
              title: "Workspace and access control",
              body: "Roles, approvals, and 2FA are built in.",
              icon: Users2,
            },
          ],
        },
        workflow: {
          title: "A short flow that explains it fast.",
          steps: [
            {
              id: "01",
              title: "Paste the link, define the slug, output the QR",
              detail: "Everything starts from one focused input.",
            },
            {
              id: "02",
              title: "Open a preview page when needed",
              detail: "Visitors pass through media and CTA first.",
            },
            {
              id: "03",
              title: "Return to the dashboard to read traffic",
              detail: "Results come back into one analytics view.",
            },
          ],
        },
        pricing: {
          badge: "Pricing",
          title: "Simple pricing.",
          highlight: "Scale with your team.",
          description:
            "Start free, then move up when the team needs more traffic and space.",
          plans: [
            {
              tier: "free" as const,
              name: "HotsNew Free",
              badge: "Starter",
              price: "Free",
              summary:
                "For people who want to try the flow.",
              meta: "3 links/day · 1 video/day · 1 workspace",
              cta: "Use for free",
              action: "register" as const,
              features: [
                "Create a basic link and move fast",
                "Preview pages before sending traffic",
                "Track basic clicks for each link",
              ],
            },
            {
              tier: "pro" as const,
              name: "Pro",
              badge: "Most popular",
              price: "149.000đ",
              period: "/ month",
              summary:
                "For creators and small teams building a steady workflow.",
              meta: "10 links/day · 10 videos/day",
              cta: "Start free trial",
              action: "register" as const,
              featured: true,
              features: [
                "1 workspace with up to 3 members",
                "Manage links, media, and preview pages in one flow",
                "Basic QR and click analytics for each link",
                "A fit for lean teams and shorter campaigns",
              ],
            },
            {
              tier: "business" as const,
              name: "Business",
              badge: "For operators",
              price: "1.430.400đ",
              previousPrice: "1.788.000đ",
              period: "/ year",
              summary:
                "Built for operators and affiliate teams running longer.",
              meta: "30 links/day · 30 videos/day",
              cta: "Create workspace",
              action: "register" as const,
              features: [
                "5 workspaces with up to 20 members",
                "A/B testing and custom output domains",
                "More routing headroom for larger operating teams",
                "Lower cost than paying 12 separate monthly cycles",
              ],
            },
          ],
        },
        install: {
          eyebrow: "Install",
          title: "Use it on the web or keep it as desktop.",
          description:
            "Open it in the browser, or install it for faster access.",
          quickItems: [
            {
              title: "Web / PWA",
              detail: "Open instantly from the browser.",
              icon: MonitorSmartphone,
            },
            {
              title: "Desktop",
              detail: "A dedicated window for daily use.",
              icon: House,
            },
            {
              title: "Teams",
              detail: "Shared access for the whole crew.",
              icon: ShieldCheck,
            },
          ],
          items: [
            {
              title: "Structured short links",
              detail: "Clean slugs and titles stay manageable.",
              icon: Link2,
            },
            {
              title: "Desktop or PWA",
              detail: "Launch it faster like a dedicated app.",
              icon: MonitorSmartphone,
            },
            {
              title: "Security and access",
              detail: "Password recovery and 2FA are ready.",
              icon: ShieldCheck,
            },
            {
              title: "Analytics for decisions",
              detail: "See what deserves more push.",
              icon: ChartNoAxesCombined,
            },
          ],
          primary: "Create account",
          secondary: "Login now",
        },
        cta: {
          title: "Stop juggling tools.",
          highlight: "Start shipping in one flow.",
          description:
            "Set up the first workspace in minutes. No complex onboarding.",
          primary: "Create account",
          secondary: "Login",
          trust: [
            { label: "QR and preview pages in one flow", icon: QrCode },
            {
              label: "Workspace access for teams stays clear",
              icon: ShieldCheck,
            },
            {
              label: "Analytics are fast enough to optimize",
              icon: ChartNoAxesCombined,
            },
          ],
        },
        changelog: {
          badge: "Changelog",
          title: "Small updates for daily work.",
          highlight: "Ship steadily, stay unblocked.",
          description:
            "Focused on faster link creation, clearer flows, and fewer mistakes.",
          items: [
            {
              version: "v2.6",
              date: "May 2026",
              title: "AI support for titles and UTM",
              body: "Draft titles and normalize tracking faster.",
            },
            {
              version: "v2.5",
              date: "April 2026",
              title: "Preview pages and QR in one flow",
              body: "No need to split page setup and QR export.",
            },
            {
              version: "v2.4",
              date: "March 2026",
              title: "Faster analytics feedback on the dashboard",
              body: "Clicks, routes, and sources return sooner.",
            },
          ],
        },
        footer: {
          description:
            "A shared workspace for links, preview pages, QR, and analytics.",
          columns: [
            {
              title: "Product",
              links: [
                { label: "Feature pipeline", href: "#showcase-features" },
                { label: "Operations hub", href: "#showcase-story" },
                { label: "Pricing", href: "#showcase-pricing" },
                { label: "Install options", href: "#showcase-install" },
              ],
            },
            {
              title: "Capabilities",
              links: [
                { label: "Preview pages", href: "#showcase-demo" },
                { label: "QR and tracking", href: "#showcase-features" },
                { label: "Workspace and teams", href: "#showcase-story" },
                { label: "Desktop / PWA", href: "#showcase-install" },
              ],
            },
            {
              title: "Get started",
              links: [
                { label: "Create account", href: "#showcase-pricing" },
                { label: "Login", href: "#showcase-demo" },
                { label: "See link creation flow", href: "#showcase-demo" },
                { label: "Choose a plan", href: "#showcase-pricing" },
              ],
            },
            {
              title: "Operations",
              links: [
                { label: "Tags and folders", href: "#showcase-demo" },
                { label: "Output domains", href: "#showcase-story" },
                { label: "Click analytics", href: "#showcase-story" },
                { label: "Access control", href: "#showcase-install" },
              ],
            },
          ],
          copyright: "© 2026 HotsNew Click. Built for cleaner link operations.",
        },
      };

  const workflowPanel = isVi
    ? {
        badge: "Trung tâm vận hành",
        title: "Một luồng cho mỗi chiến dịch.",
        highlight: "App tự ghép đúng phần cần dùng.",
        description:
          "Thay vì nhảy qua nhiều tab, đội vận hành xử lý link, preview, UTM, QR và analytics trong cùng một nhịp làm việc.",
        bullets: [
          {
            title: "Lịch sử thao tác rõ ràng",
            detail:
              "Biết ai vừa tạo link, đổi slug, bật preview hay cập nhật UTM.",
          },
          {
            title: "Team dùng chung một chuẩn",
            detail:
              "Tên chiến dịch, tag, domain đầu ra và QR được giữ đồng bộ hơn.",
          },
          {
            title: "Tối ưu ngay từ trong luồng",
            detail:
              "Không đợi cuối ngày mới đọc số, click và nguồn traffic hiện lại ngay.",
          },
        ],
        liveTitle: "Hoạt động gần đây",
        liveStatus: "live",
        rows: [
          {
            time: "14:02:18",
            user: "linh@",
            tag: "Flash Sale",
            action: "Preview",
            value: "128 click",
          },
          {
            time: "14:01:05",
            user: "khanh@",
            tag: "Shopee",
            action: "Slug",
            value: "12 link",
          },
          {
            time: "13:59:41",
            user: "nam@",
            tag: "TikTok",
            action: "UTM",
            value: "24 route",
          },
          {
            time: "13:58:12",
            user: "trang@",
            tag: "Catalog",
            action: "QR",
            value: "40 mã",
          },
          {
            time: "13:55:47",
            user: "duy@",
            tag: "Retarget",
            action: "Analytics",
            value: "22 nguồn",
          },
          {
            time: "13:51:09",
            user: "mai@",
            tag: "Campaign",
            action: "Domain",
            value: "6 host",
          },
        ],
        footerLabel: "Hôm nay",
        footerValue: "4,124 lượt click",
      }
    : {
        badge: "Live operations",
        title: "One flow for every campaign.",
        highlight: "The app brings the right block into place.",
        description:
          "Instead of bouncing between tabs, the team handles links, preview pages, UTM, QR, and analytics in one operating rhythm.",
        bullets: [
          {
            title: "A clear action trail",
            detail:
              "See who created a link, changed the slug, enabled preview, or updated tracking.",
          },
          {
            title: "A shared operating standard",
            detail:
              "Campaign names, tags, output domains, and QR assets stay more consistent.",
          },
          {
            title: "Optimization inside the flow",
            detail:
              "You do not have to wait for a report, clicks and traffic sources come back immediately.",
          },
        ],
        liveTitle: "Recent activity",
        liveStatus: "live",
        rows: [
          {
            time: "14:02:18",
            user: "linh@",
            tag: "Flash Sale",
            action: "Preview",
            value: "128 clicks",
          },
          {
            time: "14:01:05",
            user: "khanh@",
            tag: "Shopee",
            action: "Slug",
            value: "12 links",
          },
          {
            time: "13:59:41",
            user: "nam@",
            tag: "TikTok",
            action: "UTM",
            value: "24 routes",
          },
          {
            time: "13:58:12",
            user: "trang@",
            tag: "Catalog",
            action: "QR",
            value: "40 codes",
          },
          {
            time: "13:55:47",
            user: "duy@",
            tag: "Retarget",
            action: "Analytics",
            value: "22 sources",
          },
          {
            time: "13:51:09",
            user: "mai@",
            tag: "Campaign",
            action: "Domain",
            value: "6 hosts",
          },
        ],
        footerLabel: "Today",
        footerValue: "4,124 clicks",
      };

  return (
    <div className="space-y-6 lg:space-y-8">
      <motion.section
        {...sectionMotion}
        className={cn(
          "relative overflow-hidden px-1 pb-2 pt-8 sm:px-4 sm:pt-10 lg:pt-14",
          isLight ? "text-slate-950" : "text-white",
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-88",
            isLight
              ? "bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.12)_0%,rgba(255,255,255,0)_72%)]"
              : "bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.18)_0%,rgba(7,9,16,0)_72%)]",
          )}
        />
        <div className="mx-auto max-w-276 text-center">
          <a
            href="#showcase-story"
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] transition-colors",
              isLight
                ? "border-slate-200 bg-white/88 text-slate-500 shadow-[0_18px_40px_rgba(15,23,42,0.08)] hover:bg-white"
                : "border-white/10 bg-white/4 text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:bg-white/5",
            )}
          >
            <span className="relative inline-flex h-2 w-2 items-center justify-center">
              <span className="live-dot-pulse absolute inset-0 rounded-full bg-emerald-400/45" />
              <span className="relative h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.55)]" />
            </span>
            <span className="font-semibold text-emerald-400">
              {copy.hero.badge}
            </span>
            <span className={cn(isLight ? "text-slate-400" : "text-slate-400")}>·</span>
            <span>{copy.hero.badgeText}</span>
            <ArrowRight
              size={14}
              className={cn(isLight ? "text-slate-400" : "text-slate-500")}
            />
          </a>

          <h1
            className={cn(
              "mx-auto mt-7 max-w-[16ch] text-[clamp(2.15rem,10.5vw,5rem)] font-bold leading-[0.97] tracking-[-0.045em] sm:mt-8 sm:text-[clamp(2.7rem,6.6vw,5rem)]",
              isLight ? "text-slate-950" : "text-[#f2f2f2]",
            )}
          >
            {copy.hero.title}{" "}
            <span className="bg-[linear-gradient(90deg,#ff7a00_0%,#ff8f2d_46%,#fbbf24_100%)] bg-clip-text text-transparent">
              {copy.hero.highlight}
            </span>{" "}
            {copy.hero.titleEnd}
          </h1>

          <p
            className={cn(
              "mx-auto mt-6 max-w-[58ch] text-[15px] leading-7 sm:mt-7 sm:text-[17px] sm:leading-[1.65]",
              isLight ? "text-slate-600" : "text-slate-400",
            )}
          >
            {copy.hero.description}
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row">
            <button
              type="button"
              onClick={onOpenRegister}
              className="group inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-[1.05rem] bg-[linear-gradient(135deg,#ff7a00_0%,#ff5a00_58%,#ff8f2d_100%)] px-6 py-3.5 text-[14px] font-semibold text-white shadow-[0_22px_50px_rgba(255,106,0,0.28)] transition-all hover:-translate-y-0.5 hover:brightness-110 sm:min-w-42 sm:w-auto sm:rounded-[1.15rem] sm:px-7 sm:py-4 sm:text-[15px]"
            >
              {copy.hero.primary}
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </button>
            <a
              href="#showcase-demo"
              className={cn(
                "inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-[1.05rem] border px-6 py-3.5 text-[14px] font-medium transition-colors sm:min-w-42 sm:w-auto sm:rounded-[1.15rem] sm:px-7 sm:py-4 sm:text-[15px]",
                isLight
                  ? "border-slate-200 bg-white/80 text-slate-800 hover:border-slate-300 hover:bg-white"
                  : "border-white/10 bg-white/3 text-slate-100 hover:border-white/20 hover:bg-white/6",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-5 w-5 items-center justify-center rounded-full",
                  isLight ? "bg-slate-900/8" : "bg-white/10",
                )}
              >
                <Play size={10} fill="currentColor" className="ml-0.5" />
              </span>
              {copy.hero.secondary}
            </a>
          </div>

          <p
            className={cn(
              "mt-6 text-[12.5px]",
              isLight ? "text-slate-500" : "text-slate-500",
            )}
          >
            {copy.hero.note}
          </p>
        </div>

        <div
          id="showcase-demo"
          className="relative mx-auto mt-12 max-w-6xl px-1 sm:mt-16 sm:px-6"
        >
          <div
            className={cn(
              "relative rounded-[28px] p-[1.5px] shadow-[0_50px_120px_-20px_rgba(255,106,0,0.28)]",
              isLight
                ? "bg-[linear-gradient(180deg,rgba(249,115,22,0.24),rgba(255,255,255,0.92)_28%,rgba(255,255,255,0.76)_100%)]"
                : "bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.04)_30%,rgba(255,255,255,0)_100%)]",
            )}
          >
            <div
              className={cn(
                "relative overflow-hidden rounded-[27px]",
                isLight
                  ? "border border-slate-200/80 bg-[#fbfaf8]"
                  : "border border-white/6 bg-[#171923]",
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-between px-4 py-2.5",
                  isLight
                    ? "border-b border-slate-200 bg-white/88"
                    : "border-b border-white/8 bg-white/2",
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                </div>
                <div
                  className={cn(
                    "rounded-md px-3 py-1 text-[11px]",
                    isLight
                      ? "border border-slate-200 bg-slate-100 text-slate-500"
                      : "border border-white/6 bg-white/4 text-slate-500",
                  )}
                >
                  app.hotsnew.click/workspace
                </div>
                <div className="w-14.5" />
              </div>

              <div
                className={cn(
                  "p-3 sm:p-4",
                  isLight ? "bg-[#f3f0ea]" : "bg-[#11131c]",
                )}
              >
                <div
                  className={cn(
                    "overflow-hidden rounded-[18px]",
                    isLight
                      ? "border border-slate-200 bg-[#0f1118]"
                      : "border border-white/5 bg-[#0f1118]",
                  )}
                >
                  <img
                    src="/seo-real/create.png"
                    alt="HotsNew Click create link screen"
                    className="h-85 w-full object-cover object-top sm:h-110 lg:h-140"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        {...sectionMotion}
        id="showcase-aihub"
        className={cn(
          "relative left-1/2 mb-0 w-screen -translate-x-1/2 overflow-hidden px-6 py-18 sm:px-10 lg:px-14 lg:py-24",
          isLight
            ? "border-y border-slate-200 bg-[linear-gradient(180deg,#fcfaf6_0%,#f5f1ea_100%)] text-slate-950"
            : "border-y border-white/7 bg-[linear-gradient(180deg,rgba(10,12,20,0.98)_0%,rgba(7,9,16,0.98)_100%)] text-white",
        )}
      >
        <div className="relative mx-auto max-w-330">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start">
            <div className="max-w-150">
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-medium",
                isLight
                  ? "border-slate-200 bg-white/85 text-slate-600"
                  : "border-white/12 bg-white/3 text-slate-200",
              )}
            >
              <span className="h-2 w-2 rounded-full bg-orange-400" />
              <span>{copy.aiHub.badge}</span>
            </div>

            <h2
              className={cn(
                "mt-7 max-w-[13ch] text-[clamp(2rem,8vw,3.5rem)] font-bold leading-[0.96] tracking-[-0.05em] sm:text-[clamp(2.2rem,4vw,3.5rem)]",
                isLight ? "text-slate-950" : "text-white",
              )}
            >
              {copy.aiHub.title}
              <span className="mt-2 block bg-[linear-gradient(90deg,#ff7a00_0%,#ff8f2d_46%,#f59e0b_100%)] bg-clip-text text-transparent">
                {copy.aiHub.highlight}
              </span>
            </h2>

            <p
              className={cn(
                "mt-5 max-w-[58ch] text-[15px] leading-7 sm:mt-6 sm:text-[16px]",
                isLight ? "text-slate-600" : "text-slate-400",
              )}
            >
              {copy.aiHub.description}
            </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {copy.aiHub.cards.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className={cn(
                      "rounded-[1.6rem] border p-5 sm:rounded-[1.8rem] sm:p-6",
                      isLight
                        ? "border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.06)]"
                        : "border-white/8 bg-[rgba(255,255,255,0.03)] shadow-[0_24px_60px_rgba(3,8,20,0.24)]",
                      item.title === "Soát preview trước khi publish" &&
                        "hidden sm:block",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-[0.95rem] bg-[rgba(249,115,22,0.12)] sm:h-11 sm:w-11 sm:rounded-[1rem]",
                        isLight ? "text-orange-600" : "text-orange-200",
                      )}
                    >
                      <Icon size={17} className="sm:h-[19px] sm:w-[19px]" />
                    </div>
                    <h3
                      className={cn(
                        "mt-4 text-[0.92rem] font-bold tracking-[-0.02em] sm:mt-5 sm:text-[1rem]",
                        isLight ? "text-slate-950" : "text-white",
                      )}
                    >
                      {item.title}
                    </h3>
                    <p
                      className={cn(
                        "mt-2 text-[13px] leading-6 sm:text-[14px] sm:leading-7",
                        isLight ? "text-slate-600" : "text-slate-400",
                      )}
                    >
                      {item.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        {...sectionMotion}
        id="showcase-customers"
        className="relative left-1/2 mb-0 w-screen -translate-x-1/2 overflow-hidden"
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-0",
            isLight
              ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(244,240,234,0.96)_100%)]"
              : "bg-[rgba(5,7,14,0.76)]",
          )}
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-33",
            isLight
              ? "bg-[linear-gradient(180deg,rgba(249,115,22,0.08)_0%,rgba(255,255,255,0.06)_58%,rgba(255,255,255,0)_100%)]"
              : "bg-[linear-gradient(180deg,rgba(5,7,14,0.12)_0%,rgba(5,7,14,0.68)_58%,rgba(5,7,14,0.4)_100%)]",
          )}
        />
        <div
          className={cn(
            "relative px-6 py-8 text-center sm:px-10 sm:pb-14 sm:pt-14",
            isLight ? "border-y border-slate-200" : "border-y border-white/7",
          )}
        >
          <p
            className={cn(
              "text-[12px] font-semibold uppercase tracking-[0.18em] sm:text-[13px] sm:tracking-[0.22em]",
              isLight ? "text-slate-500" : "text-slate-400/95",
            )}
          >
            {copy.proof.summary}
          </p>

          <div
            className={cn(
              "mt-8 hidden flex-wrap items-center justify-center gap-x-14 gap-y-5 sm:mt-10 sm:flex",
              isLight ? "text-slate-500" : "text-slate-500",
            )}
          >
            {copy.proof.items.map((item, index) => (
              <div
                key={item}
                className="flex items-center gap-3 text-[13px] font-medium sm:text-[14px]"
              >
                {index === 3 ? (
                  <span className="text-[12px] text-slate-500">★</span>
                ) : (
                  <span
                    className={`h-4 w-4 ${
                      index === 1
                        ? `${isLight ? "border-slate-200" : "border-white/10"} rounded-none bg-transparent text-[13px] italic text-slate-500`
                        : index === 5
                          ? `${isLight ? "bg-slate-300" : "bg-white/40"} rounded-sm border-0`
                          : `${isLight ? "border-slate-300 bg-slate-200/70" : "border-white/10 bg-white/10"} rounded-full`
                    }`}
                  >
                    {index === 1 ? "L" : ""}
                  </span>
                )}
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        {...sectionMotion}
        id="showcase-features"
        className={cn(
          "relative left-1/2 mb-0 w-screen -translate-x-1/2 overflow-hidden px-6 py-18 sm:px-10 lg:px-14 lg:py-24",
          isLight ? "text-slate-950" : "text-white",
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-40",
            isLight
              ? "bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.12)_0%,rgba(249,115,22,0.04)_34%,rgba(255,255,255,0)_76%)]"
              : "bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.18)_0%,rgba(249,115,22,0.08)_34%,rgba(7,9,16,0)_76%)]",
          )}
        />

        <div className="relative mx-auto max-w-330">
          <div className="mx-auto max-w-270 text-center">
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-medium",
                isLight
                  ? "border-slate-200 bg-white/80 text-slate-600"
                  : "border-white/12 bg-white/3 text-slate-200",
              )}
            >
              <span className="h-2 w-2 rounded-full bg-orange-400" />
              <span>{copy.features.badge}</span>
            </div>

            <h2
              className={cn(
                "mx-auto mt-8 max-w-[22ch] text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[0.98] tracking-[-0.04em]",
                isLight ? "text-slate-950" : "text-white",
              )}
            >
              {copy.features.title}
              <span className="mt-2 block bg-[linear-gradient(90deg,#ff7a00_0%,#fb923c_52%,#fbbf24_100%)] bg-clip-text text-transparent">
                {copy.features.highlight}
              </span>
            </h2>

            <p className={cn("mx-auto mt-6 max-w-190 text-[16px] leading-7", isLight ? "text-slate-600" : "text-slate-400")}>
              {copy.features.description}
            </p>
          </div>

          <div className="relative mt-16">
            <div className="absolute left-0 right-0 top-9 h-px bg-[linear-gradient(90deg,rgba(90,96,128,0.1)_0%,rgba(249,115,22,0.5)_50%,rgba(90,96,128,0.1)_100%)]" />
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
              {copy.features.stages.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="relative text-center">
                    <div
                      className={cn(
                        "mx-auto flex h-16 w-16 items-center justify-center rounded-[1rem] border shadow-[0_22px_50px_rgba(10,12,24,0.12)] sm:h-19 sm:w-19 sm:rounded-[1.15rem]",
                        isLight
                          ? "border-orange-100 bg-[linear-gradient(180deg,#ffffff_0%,#fff7ed_100%)]"
                          : "border-[#9a4512] bg-[linear-gradient(180deg,rgba(46,24,12,0.98)_0%,rgba(23,13,7,0.98)_100%)] shadow-[0_22px_50px_rgba(10,12,24,0.35)]",
                      )}
                    >
                      <Icon size={18} className={cn(isLight ? "text-orange-600" : "text-orange-200", "sm:h-6 sm:w-6")} />
                    </div>
                    <h3 className={cn("mt-3 text-[0.74rem] font-semibold tracking-[-0.02em] sm:mt-5 sm:text-[0.92rem]", isLight ? "text-slate-950" : "text-white")}>
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[11px] leading-4 text-slate-500 sm:mt-1.5 sm:text-[13px] sm:leading-5">
                      {item.note}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        {...sectionMotion}
        id="showcase-story"
        className={cn(
          "relative left-1/2 mb-0 w-screen -translate-x-1/2 overflow-hidden px-6 py-18 sm:px-10 lg:px-14 lg:py-24",
          isLight
            ? "border-y border-slate-200 bg-[linear-gradient(180deg,#f8f5ef_0%,#f3efe8_100%)] text-slate-950"
            : "border-y border-white/7 bg-[rgba(6,8,15,0.8)] text-white",
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.18)_0%,rgba(249,115,22,0.06)_34%,rgba(6,8,15,0)_78%)]" />
        <div className="relative mx-auto grid max-w-295 gap-12 xl:grid-cols-[minmax(0,0.92fr)_minmax(420px,0.88fr)] xl:items-center">
          <div className="max-w-157.5">
            <div className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-medium", isLight ? "border-slate-200 bg-white/80 text-slate-600" : "border-white/12 bg-white/4 text-slate-200")}>
              <span className="h-2 w-2 rounded-full bg-orange-400" />
              <span>{workflowPanel.badge}</span>
            </div>

            <h2 className={cn("mt-6 max-w-[11ch] text-[clamp(1.7rem,7.2vw,3rem)] font-bold leading-[0.98] tracking-[-0.04em] sm:mt-7 sm:text-[clamp(1.9rem,3.6vw,3rem)]", isLight ? "text-slate-950" : "text-white")}>
              {workflowPanel.title}
              <span className="mt-2 block text-[#f97316]">
                {workflowPanel.highlight}
              </span>
            </h2>

            <p className={cn("mt-5 max-w-[58ch] text-[15px] leading-7 sm:mt-7 sm:text-[16px]", isLight ? "text-slate-600" : "text-slate-400")}>
              {workflowPanel.description}
            </p>

            <div className="mt-8 space-y-5 sm:mt-10 sm:space-y-6">
              {workflowPanel.bullets.map((item) => (
                <div
                  key={item.title}
                  className="grid gap-3 sm:grid-cols-[20px_minmax(0,1fr)] sm:items-start"
                >
                  <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-[0.7rem] border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                    <Check size={15} strokeWidth={2.6} />
                  </span>
                  <div>
                    <h3 className={cn("text-[0.84rem] font-semibold tracking-[-0.018em] sm:text-[0.88rem]", isLight ? "text-slate-950" : "text-white")}>
                      {item.title}
                    </h3>
                    <p className="mt-1.5 max-w-[58ch] text-[12px] leading-6 text-slate-500 sm:text-[13px]">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={cn("hidden rounded-4xl border p-5 sm:block sm:p-6", isLight ? "border-slate-200 bg-white/88 shadow-[0_30px_80px_rgba(15,23,42,0.08)]" : "border-white/8 bg-[linear-gradient(180deg,rgba(18,21,32,0.98)_0%,rgba(14,16,25,0.96)_100%)] shadow-[0_30px_80px_rgba(4,6,12,0.45)]")}>
            <div className={cn("flex items-center justify-between gap-3 pb-4", isLight ? "border-b border-slate-200" : "border-b border-white/8")}>
              <div className="flex items-center gap-3">
                <span className="relative inline-flex h-2.5 w-2.5 items-center justify-center">
                  <span className="live-dot-pulse absolute inset-0 rounded-full bg-emerald-400/45" />
                  <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(74,222,128,0.65)]" />
                </span>
                <div className={cn("text-[13px] font-semibold tracking-[-0.02em]", isLight ? "text-slate-950" : "text-white")}>
                  {workflowPanel.liveTitle}
                </div>
              </div>
              <div className="text-[12px] text-slate-500">
                {workflowPanel.liveStatus}
              </div>
            </div>

            <div className="mt-2">
              {workflowPanel.rows.map((row) => (
                <div
                  key={`${row.time}-${row.user}-${row.action}`}
                  className={cn("grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-3 py-4 sm:grid-cols-[82px_88px_minmax(0,1fr)_92px_auto]", isLight ? "border-b border-slate-200" : "border-b border-white/6")}
                >
                  <div className="text-[12px] font-medium tabular-nums text-slate-500">
                    {row.time}
                  </div>
                  <div className={cn("text-[13px] font-semibold", isLight ? "text-slate-800" : "text-slate-200")}>
                    {row.user}
                  </div>
                  <div className="flex min-w-0 items-center gap-3 sm:contents">
                    <span className={cn("inline-flex w-fit rounded-md px-2.5 py-1 text-[11px] font-semibold", isLight ? "border border-orange-200 bg-orange-50 text-orange-700" : "border border-[#8b4519] bg-[#3a1f12] text-orange-200")}>
                      {row.tag}
                    </span>
                    <span className="truncate text-[13px] text-slate-400">
                      {row.action}
                    </span>
                  </div>
                  <div className={cn("text-right text-[13px] font-semibold", isLight ? "text-slate-800" : "text-slate-100")}>
                    {row.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-end justify-between gap-4 pt-5">
              <div className="text-[12px] text-slate-500">
                {workflowPanel.footerLabel}
              </div>
              <div className={cn("text-right text-[1.7rem] font-semibold tracking-[-0.04em]", isLight ? "text-slate-950" : "text-white")}>
                {workflowPanel.footerValue}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        {...sectionMotion}
        id="showcase-pricing"
        className={cn(
          "relative left-1/2 mb-0 w-screen -translate-x-1/2 overflow-hidden px-6 py-18 sm:px-10 lg:px-14 lg:py-24",
          isLight
            ? "border-y border-slate-200 bg-[linear-gradient(180deg,#faf8f4_0%,#f4f0ea_100%)] text-slate-950"
            : "border-y border-white/7 text-white",
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.18)_0%,rgba(249,115,22,0.06)_34%,rgba(6,8,15,0)_78%)]" />
        <div className="relative mx-auto max-w-305">
          <div className="mx-auto max-w-190 text-center">
            <div className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-medium", isLight ? "border-slate-200 bg-white/80 text-slate-600" : "border-white/12 bg-white/4 text-slate-200")}>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>{copy.pricing.badge}</span>
            </div>

            <h2 className={cn("mx-auto mt-7 max-w-[15ch] text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[0.98] tracking-[-0.04em]", isLight ? "text-slate-950" : "text-white")}>
              {copy.pricing.title}
              <span className="mt-2 block bg-[linear-gradient(90deg,#ff7a00_0%,#fb923c_40%,#fbbf24_100%)] bg-clip-text text-transparent">
                {copy.pricing.highlight}
              </span>
            </h2>

            <p className={cn("mx-auto mt-6 max-w-176 text-[16px] leading-7", isLight ? "text-slate-600" : "text-slate-400")}>
              {copy.pricing.description}
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {copy.pricing.plans.map((plan) => {
              const isFeatured = !!plan.featured;
              const isFree = plan.tier === "free";
              const buttonAction = onOpenRegister;

              return (
                <div
                  key={plan.name}
                  className={`relative flex h-full flex-col rounded-4xl border p-7 shadow-[0_24px_60px_rgba(3,8,20,0.24)] transition-transform hover:-translate-y-1 sm:p-8 ${
                    isFeatured
                      ? isLight
                        ? "border-orange-400 bg-[linear-gradient(180deg,#ffffff_0%,#fff7ed_100%)] ring-1 ring-orange-300/50"
                        : "border-orange-500/55 bg-[linear-gradient(180deg,rgba(34,20,12,0.98)_0%,rgba(18,12,8,0.98)_100%)] ring-1 ring-orange-400/35"
                      : isFree
                        ? isLight
                          ? "border-orange-200 bg-[linear-gradient(180deg,#ffffff_0%,#fffaf3_100%)] ring-1 ring-orange-100"
                          : "border-orange-500/25 bg-[linear-gradient(180deg,rgba(31,22,16,0.96)_0%,rgba(18,16,14,0.96)_100%)] ring-1 ring-white/8"
                        : isLight
                          ? "border-slate-200 bg-white/88"
                          : "border-white/10 bg-[rgba(17,20,31,0.92)]"
                  }`}
                >
                  {isFeatured && (
                    <div className="absolute left-8 top-0 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,#ff7a00_0%,#ff8f2d_100%)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-white shadow-[0_14px_30px_rgba(255,106,0,0.32)]">
                      {plan.badge}
                    </div>
                  )}

                  {!isFeatured && (
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {plan.badge}
                    </div>
                  )}

                  <div className={isFeatured ? "mt-5" : "mt-1"}>
                    <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {plan.name}
                    </div>

                    {plan.previousPrice && (
                      <div className="mt-5 text-[12px] font-semibold tracking-[0.02em] text-slate-500 line-through">
                        {plan.previousPrice}
                      </div>
                    )}

                    <div className="mt-5 flex items-end gap-2">
                      <span className={cn("text-[3.1rem] font-bold leading-none tracking-[-0.05em]", isLight ? "text-slate-950" : "text-white")}>
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="pb-2 text-[0.95rem] font-medium text-slate-400">
                          {plan.period}
                        </span>
                      )}
                    </div>

                    <p className="mt-5 min-h-12 text-[14px] leading-7 text-slate-400">
                      {plan.summary}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={buttonAction}
                    className={`mt-8 inline-flex items-center justify-center rounded-[1.1rem] px-5 py-4 text-[14px] font-semibold transition-all ${
                      isFeatured
                        ? "bg-[linear-gradient(90deg,#ff7a00_0%,#ff5a00_100%)] text-white shadow-[0_20px_36px_rgba(255,106,0,0.32)] hover:brightness-110"
                        : isFree
                          ? isLight
                            ? "border border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-300 hover:bg-orange-100"
                            : "border border-orange-500/30 bg-[rgba(249,115,22,0.12)] text-white hover:border-orange-400/45 hover:bg-[rgba(249,115,22,0.18)]"
                          : isLight
                            ? "border border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                            : "border border-white/10 bg-white/2 text-white hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    {plan.cta}
                  </button>

                  <div className={cn("mt-6 inline-flex w-fit rounded-xl border px-3 py-2 text-[12px]", isLight ? "border-slate-200 bg-slate-100 text-slate-600" : "border-white/8 bg-white/3 text-slate-300")}>
                    {plan.meta}
                  </div>

                  <div className="mt-7 space-y-4">
                    {plan.features.map((feature, index) => (
                      <div
                        key={feature}
                        className={cn(
                          "flex items-start gap-3",
                          index === 3 && "hidden sm:flex",
                        )}
                      >
                        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-emerald-300">
                          <Check size={15} strokeWidth={2.8} />
                        </span>
                        <span className={cn("text-[14px] leading-7", isLight ? "text-slate-700" : "text-slate-300")}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      <motion.section
        {...sectionMotion}
        id="showcase-install"
        className={cn(
          "relative left-1/2 mb-0 w-screen -translate-x-1/2 overflow-hidden px-6 py-18 sm:px-10 lg:px-14 lg:py-24",
          isLight
            ? "border-y border-[#ddd4c7] bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.08)_0%,rgba(248,244,237,1)_36%,rgba(238,231,221,1)_100%)] text-slate-950"
            : "border-y border-white/7 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.16)_0%,rgba(7,9,16,0.98)_52%,rgba(5,7,14,1)_100%)] text-white",
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,transparent_18%)]" />
        <div className="relative mx-auto max-w-330">
          <div className={cn("grid gap-8 rounded-[2.35rem] border p-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:p-8", isLight ? "border-[#ddd4c7] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(249,245,239,0.94)_100%)] shadow-[0_32px_90px_rgba(89,72,40,0.10)]" : "border-white/8 bg-[rgba(10,12,20,0.82)] shadow-[0_32px_90px_rgba(5,7,14,0.46)]")}>
              <div className="max-w-[34rem]">
              <p className={cn("text-[11px] font-black uppercase tracking-[0.26em]", isLight ? "text-orange-500" : "text-orange-300/90")}>
                {copy.install.eyebrow}
              </p>
              <h2 className={cn("mt-4 max-w-[12ch] text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[0.98] tracking-[-0.04em]", isLight ? "text-slate-950" : "text-white")}>
                {copy.install.title}
              </h2>
              <p className={cn("mt-4 max-w-[54ch] text-[16px] leading-7", isLight ? "text-slate-600" : "text-slate-400")}>
                {copy.install.description}
              </p>

              <div className="mt-8 hidden grid gap-3 sm:grid-cols-3">
                {copy.install.quickItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className={cn("rounded-[1.35rem] border p-4", isLight ? "border-[#e4dbcf] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.04)]" : "border-white/8 bg-white/[0.03]")}
                    >
                      <div className={cn("flex h-9 w-9 items-center justify-center rounded-[0.9rem] bg-[rgba(249,115,22,0.12)]", isLight ? "text-orange-600" : "text-orange-200")}>
                        <Icon size={16} />
                      </div>
                      <h3 className={cn("mt-3 text-[0.88rem] font-bold tracking-[-0.02em]", isLight ? "text-slate-950" : "text-white")}>
                        {item.title}
                      </h3>
                      <p className="mt-1 text-[12px] leading-6 text-slate-500">
                        {item.detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {copy.install.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className={cn("rounded-[1.6rem] border p-5", isLight ? "border-[#e4dbcf] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.05)]" : "border-white/8 bg-[rgba(255,255,255,0.03)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]")}
                  >
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-[0.95rem] bg-[rgba(249,115,22,0.12)]", isLight ? "text-orange-600" : "text-orange-200")}>
                      <Icon size={18} />
                    </div>
                    <h3 className={cn("mt-4 text-[0.9rem] font-black tracking-[-0.02em]", isLight ? "text-slate-950" : "text-white")}>
                      {item.title}
                    </h3>
                    <p className={cn("mt-1.5 text-[12px] leading-6", isLight ? "text-slate-600" : "text-slate-400")}>
                      {item.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        {...sectionMotion}
        id="showcase-cta"
        className={cn(
          "relative left-1/2 mb-0 w-screen -translate-x-1/2 overflow-hidden px-6 py-20 sm:px-10 lg:px-14 lg:py-24",
          isLight
            ? "border-t border-slate-200 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.08)_0%,rgba(248,246,241,1)_42%,rgba(244,240,234,1)_100%)] text-slate-950"
            : "border-t border-white/7 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.16)_0%,rgba(9,10,18,0.98)_42%,rgba(5,7,14,1)_100%)] text-white",
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,transparent_18%)]" />
        <div className="relative mx-auto max-w-215 text-center">
            <h2 className={cn("mx-auto max-w-[14.5ch] text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[0.98] tracking-[-0.04em]", isLight ? "text-slate-950" : "text-white")}>
            {copy.cta.title}
            <span className="mt-2 block bg-[linear-gradient(90deg,#ff7a00_0%,#fb923c_48%,#fbbf24_100%)] bg-clip-text text-transparent">
              {copy.cta.highlight}
            </span>
          </h2>

          <p className={cn("mx-auto mt-6 max-w-176 text-[16px] leading-7", isLight ? "text-slate-600" : "text-slate-400")}>
            {copy.cta.description}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onOpenRegister}
              className="group inline-flex items-center justify-center gap-2 rounded-[1.15rem] bg-[linear-gradient(90deg,#ff7a00_0%,#ff5a00_100%)] px-6 py-4 text-[14px] font-semibold text-white shadow-[0_20px_36px_rgba(255,106,0,0.3)] transition-all hover:brightness-110"
            >
              {copy.cta.primary}
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </button>
            <button
              type="button"
              onClick={onOpenLogin}
              className={cn("inline-flex items-center justify-center rounded-[1.15rem] border px-6 py-4 text-[14px] font-medium transition-colors", isLight ? "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50" : "border-white/10 bg-white/3 text-slate-100 hover:border-white/20 hover:bg-white/5")}
            >
              {copy.cta.secondary}
            </button>
          </div>

          <div className="mt-10 hidden flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[13px] text-slate-400 sm:flex">
            {copy.cta.trust.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="inline-flex items-center gap-2.5"
                >
                  <Icon size={15} className="text-slate-500" />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      <motion.section
        {...sectionMotion}
        id="showcase-changelog"
        className={cn(
          "relative left-1/2 mb-0 w-screen -translate-x-1/2 overflow-hidden px-6 py-18 sm:px-10 lg:px-14 lg:py-24",
          isLight
            ? "border-t border-slate-200 bg-[linear-gradient(180deg,#faf8f4_0%,#f3efe8_100%)] text-slate-950"
            : "border-t border-white/7 bg-[linear-gradient(180deg,rgba(7,9,16,0.98)_0%,rgba(10,12,20,0.98)_100%)] text-white",
        )}
      >
        <div className="relative mx-auto max-w-330">
          <div className="mx-auto max-w-190 text-center">
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-medium",
                isLight
                  ? "border-slate-200 bg-white/85 text-slate-600"
                  : "border-white/12 bg-white/3 text-slate-200",
              )}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>{copy.changelog.badge}</span>
            </div>

            <h2
              className={cn(
                "mx-auto mt-7 max-w-[16ch] text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[0.98] tracking-[-0.04em]",
                isLight ? "text-slate-950" : "text-white",
              )}
            >
              {copy.changelog.title}
              <span className="mt-2 block bg-[linear-gradient(90deg,#ff7a00_0%,#fb923c_40%,#fbbf24_100%)] bg-clip-text text-transparent">
                {copy.changelog.highlight}
              </span>
            </h2>

            <p
              className={cn(
                "mx-auto mt-6 max-w-176 text-[16px] leading-7",
                isLight ? "text-slate-600" : "text-slate-400",
              )}
            >
              {copy.changelog.description}
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {copy.changelog.items.map((item) => (
              <div
                key={`${item.version}-${item.title}`}
                className={cn(
                  "rounded-[1.8rem] border p-6",
                  isLight
                    ? "border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.06)]"
                    : "border-white/8 bg-[rgba(255,255,255,0.03)] shadow-[0_24px_60px_rgba(3,8,20,0.24)]",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[12px] font-black uppercase tracking-[0.16em] text-orange-500">
                    {item.version}
                  </div>
                  <div className="text-[12px] text-slate-500">{item.date}</div>
                </div>
                <h3
                  className={cn(
                    "mt-5 text-[1rem] font-bold tracking-[-0.02em]",
                    isLight ? "text-slate-950" : "text-white",
                  )}
                >
                  {item.title}
                </h3>
                <p
                  className={cn(
                    "mt-2 text-[14px] leading-7",
                    isLight ? "text-slate-600" : "text-slate-400",
                  )}
                >
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.footer
        {...sectionMotion}
        className={cn("relative left-1/2 w-screen -translate-x-1/2 px-4 pb-8 pt-8 sm:px-10 sm:pb-10 sm:pt-12 lg:px-14", isLight ? "border-t border-[#ddd4c7] bg-[linear-gradient(180deg,#eee6da_0%,#e7dfd3_100%)] text-slate-950" : "border-t border-white/7 bg-[linear-gradient(180deg,#05070e_0%,#05060c_100%)] text-white")}
      >
        <div className={cn("pointer-events-none absolute inset-0", isLight ? "bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.04)_0%,transparent_28%)]" : "bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.08)_0%,transparent_34%)]")} />
        <div className="mx-auto max-w-7xl pt-6 sm:pt-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)]">
            <div className={cn("col-span-2 max-w-none rounded-[1.45rem] sm:rounded-[1.8rem] lg:col-span-1 lg:max-w-90", isLight ? "bg-white/55 p-4 shadow-[0_18px_50px_rgba(89,72,40,0.08)] sm:p-6" : "p-0")}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[0.9rem] bg-[linear-gradient(135deg,#ff7a00_0%,#ff5a00_60%,#ff8f2d_100%)] shadow-[0_0_28px_rgba(255,106,0,0.22)] sm:h-11 sm:w-11 sm:rounded-[0.95rem]">
                  <img
                    src="/logo-app-192.png"
                    alt="HotsNew Click"
                    className="h-6 w-6 rounded-md object-cover sm:h-7 sm:w-7"
                  />
                </div>
                <div>
                  <p className={cn("text-[0.98rem] font-bold tracking-[-0.03em] sm:text-[1.05rem]", isLight ? "text-slate-950" : "text-white")}>
                    HotsNew <span className={cn(isLight ? "text-orange-600" : "text-orange-300")}>Click</span>
                  </p>
                </div>
              </div>

              <p className={cn("mt-4 max-w-[26ch] text-[13px] leading-6 sm:mt-5 sm:max-w-none sm:text-[15px] sm:leading-7", isLight ? "text-slate-600" : "text-slate-400")}>
                {copy.footer.description}
              </p>
            </div>

            <div className="col-span-2 grid grid-cols-2 gap-x-6 gap-y-7 sm:gap-8 xl:grid-cols-4">
              {copy.footer.columns.map((column) => (
                <div key={column.title} className="min-w-0">
                  <div className={cn("text-[10px] font-black uppercase tracking-[0.16em] sm:text-[12px]", isLight ? "text-slate-500" : "text-slate-500")}>
                    {column.title}
                  </div>
                  <div className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
                    {column.links.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        className={cn("block text-[13px] leading-5 transition-colors sm:text-[15px] sm:leading-normal", isLight ? "text-slate-600 hover:text-slate-950" : "text-slate-400 hover:text-white")}
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={cn("mt-8 border-t pt-5 text-[12px] text-slate-500 sm:mt-10 sm:pt-6 sm:text-[13px]", isLight ? "border-slate-300/70" : "border-white/8")}>
            {copy.footer.copyright}
          </div>
        </div>
      </motion.footer>
    </div>
  );
}

