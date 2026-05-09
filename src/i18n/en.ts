export const en = {
  common: {
    language: {
      switch: "Switch language",
      vietnamese: "Vietnamese",
      english: "English",
    },
    theme: {
      light: "Light mode",
      dark: "Dark mode",
      system: "Follow system",
    },
    footer: {
      infrastructure: "© 2026 hotsnew.click operating infrastructure",
    },
    installApp: {
      installedTitle: "App is installed",
      installedDescription:
        "You can open HotsNew as a standalone app on this device.",
      menuTitle: "Install from browser menu",
      menuDescription:
        "If the install prompt is not visible, open the browser menu and choose install app.",
      installing: "Installing app...",
      installNow: "Install HotsNew app",
      installHint:
        "Add your workspace to desktop or home screen in one step.",
    },
  },
  notificationBell: {
    ariaOpen: "Open notifications",
    title: "Notifications",
    unreadCount: "{count} unread notifications",
    emptyNew: "No new notifications",
    markAll: "Mark all read",
    loading: "Loading notifications...",
    empty: "No notifications yet.",
    groups: {
      team: "Team",
      links: "Links",
      system: "System",
    },
    relative: {
      minutes: "{count} minutes ago",
      hours: "{count} hours ago",
      days: "{count} days ago",
    },
    role: {
      owner: "owner",
      editor: "editor",
      viewer: "viewer",
    },
    quotas: {
      linkDaily: "link creation quota",
      videoDaily: "video upload quota",
      teamWorkspace: "team workspace slots",
    },
    items: {
      workspaceInvitation: {
        title: "You have a workspace invitation",
        message:
          "{inviter} invited you to the workspace {workspace} as {role}.",
      },
      workspaceInvitationAccepted: {
        title: "Workspace invitation accepted",
        message:
          "{member} accepted the invitation to workspace {workspace} ({role}).",
      },
      workspaceInvitationDeclined: {
        title: "Workspace invitation declined",
        message:
          "{member} declined the invitation to workspace {workspace} ({role}).",
      },
      workspaceMembershipUpdated: {
        title: "Workspace role updated",
        message:
          "Your role in workspace {workspace} was changed to {role}.",
      },
      workspaceMembershipRemoved: {
        title: "Removed from workspace",
        message: "You are no longer a member of workspace {workspace}.",
      },
      linkClickThreshold: {
        title: "Link reached {count} clicks",
        message: "{label} just reached {count} clicks.",
      },
      linkExpiringSoon: {
        title: "Link expiring soon",
        message: "{label} will expire in about {hours} hours.",
      },
      quotaWarning: {
        title: "Quota warning",
        message: "You have {remaining} {quotaLabel} remaining.",
      },
      subscriptionExpiring: {
        title: "Plan expiring soon",
        message: "Your {plan} plan will expire in about {days} days.",
      },
    },
  },
  pendingApproval: {
    title: "Pending approval",
    description:
      "Your account is waiting for admin approval to keep the system secure.",
    signOut: "Sign out",
  },
  twoFactor: {
    title: "Two-factor verification",
    subtitle: "{account} requires a TOTP code to access the app.",
    accountFallback: "Your account",
    codeLabel: "6-digit verification code",
    verifying: "Verifying...",
    submit: "Verify and enter app",
    signOut: "Sign out",
  },
  sidebar: {
    logoAlt: "HotsNew Click icon",
    close: "Close navigation",
    currentWorkspace: "Current workspace",
    mainMenu: "Main menu",
    dashboard: "Dashboard",
    createLinks: "Create links",
    linkList: "Link list",
    analytics: "Analytics",
    team: "Workspace team",
    installApp: "Install app",
    admin: "Admin",
    userManagement: "User management",
    contactAdmin: "Contact admin on Zalo",
    plans: "Plans",
    profile: "Profile",
    signOut: "Sign out",
    accountMenu: "Open account menu",
    accountAvatar: "Account avatar",
    roleAdmin: "Administrator",
    rolePaid: "Paid member",
    roleFree: "Free member",
  },
  app: {
    loading: "Initializing system...",
    createLocked: {
      titleViewer: "This workspace is view only",
      titleUpgrade: "Upgrade account",
      descriptionViewer:
        "Your current workspace is view only, so you cannot create or edit links yet. Switch to another workspace or ask the owner to grant editor access.",
      descriptionUpgrade:
        "Shopee and TikTok link conversion is available for paid accounts. Please contact the administrator to upgrade your plan.",
      actionViewer: "Open team area",
      actionUpgrade: "Back to dashboard",
    },
  },
  auth: {
    hero: {
      badge: "Premium authentication experience",
      eyebrow: "HotsNew Click platform",
      title: "Manage Shopee links",
      accent: "fast, polished, and professional.",
      description:
        "Create short links, build strong preview pages, and track campaign performance in one clean workspace.",
      features: [
        {
          title: "Polished preview pages",
          detail:
            "Landing pages, analytics, and authentication share one clean design language.",
        },
        {
          title: "Real-time performance",
          detail:
            "Track clicks, conversions, and campaign quality in one place.",
        },
        {
          title: "Security built in",
          detail:
            "Remembered sessions, password recovery, and two-factor protection for real operations.",
        },
      ],
      preview: {
        eyebrow: "Preview ecosystem",
        title: "Dashboard, landing page, and authentication in one rhythm.",
        statLabel: "Direct conversion",
        imageAlt: "HotsNew interface preview",
        demoLabel: "Showcase",
        demoTitle: "Short links, landing pages, and analytics in one flow",
      },
    },
    topbar: {
      tagline: "Workspace for commerce links",
      security: "Secure authentication",
    },
    footer: "HotsNew Click © 2026 • Built for sellers and operations teams",
    panel: {
      badges: {
        default: "Authentication workspace",
        recovery: "Account recovery",
      },
      titles: {
        login: "Sign in to the system",
        register: "Create a new account",
        recovery: "Reset password",
      },
      subtitles: {
        login: "Access your dashboard in a single step",
        register: "Start setting up your workspace",
        recovery: "Update your access details",
      },
      chips: {
        login: "Live",
        register: "New",
        recovery: "Reset",
      },
      tabs: {
        login: "Sign in",
        register: "Register",
      },
      fields: {
        email: "Email address",
        password: "Password",
        newPassword: "New password",
        confirmPassword: "Confirm password",
        confirmPasswordRegister: "Re-enter password",
      },
      placeholders: {
        email: "you@example.com",
      },
      misc: {
        forgotPassword: "Forgot password?",
        rememberMe: "Remember sign-in on this device",
      },
      actions: {
        login: "Access system",
        register: "Create account",
        recovery: "Save new password",
        cancelLoading: "Cancel and retry if it hangs",
      },
      errors: {
        confirmPasswordMismatch: "The password confirmation does not match.",
      },
      feedback: {
        sessionExpired: "Your session has expired. Please sign in again.",
        registerPasswordMismatch:
          "The password confirmation does not match.",
        emailInUse:
          "This email is already in use. Please sign in or use another email.",
        registerSuccess:
          "Registration succeeded. Supabase sent a confirmation email. Please open your inbox and confirm the account before signing in.",
        loginFailed: "Sign-in failed. Please try again.",
        invalidCredentials:
          "The email or password is incorrect. Please check and try again.",
        emailRateLimit:
          "Supabase is temporarily rate-limiting confirmation emails. Wait a few minutes and try registering again.",
        userNotFound: "No account was found for this email.",
        invalidEmail: "The email address is invalid. Please check it again.",
        resetEmailSent:
          "A password reset email has been sent. Open your inbox and follow the link to set a new password.",
        resetEmailFailed: "Unable to send the password reset email.",
        tooManyRequests:
          "You have requested this too many times. Please wait a few minutes and try again.",
        newPasswordMin:
          "The new password must be at least 6 characters long.",
        recoveryPasswordMismatch:
          "The password confirmation does not match.",
        passwordUpdated:
          "Your password has been updated successfully. You can continue using the account.",
        updatePasswordFailed: "Unable to update the password.",
        validRecoveryLink:
          "The recovery link is valid. Please enter a new password for your account.",
      },
    },
  },
  installCenter: {
    badge: "Install app",
    title:
      "Install once to access your workspace faster and more cleanly every day.",
    description:
      "This page keeps only one job: helping users install HotsNew as a standalone app for smoother operations.",
    highlights: [
      {
        label: "Install time",
        value: "1 minute",
        hint: "You only need to install once on the device you use.",
      },
      {
        label: "Quick access",
        value: "1 tap open",
        hint: "Open your workspace like a standalone app instead of searching for the right browser tab.",
      },
      {
        label: "Best for",
        value: "Operations team",
        hint: "Made for people who open the dashboard many times a day.",
      },
    ],
    status: {
      eyebrow: "Install status",
      title: "Standalone HotsNew app",
      labels: {
        installed: "The app is already available on this device",
        ready: "You can install it directly right now",
        menu: "Open the browser menu to install the app",
      },
      descriptions: {
        installed:
          "This device already has the app. You can open HotsNew as a dedicated tool without returning to a browser tab.",
        ready:
          "Your current browser supports direct install. Use the button below to place HotsNew on your desktop or home screen.",
        menu:
          "If you do not see the install prompt, open the browser menu and choose install app from there.",
      },
    },
    platforms: {
      eyebrow: "Platform downloads",
      title: "Distribute the desktop app from one install screen",
      description:
        "Use the real Windows release when you have it. Until then, supported desktop browsers can still install the current web app.",
      actions: {
        installHere: "Install on this device",
        desktopDownload: "Download PC app",
        unavailable: "Release not configured yet",
      },
      hints: {
        direct: "Direct distribution link",
        fallback:
          "Fallback to browser install is still available on supported devices.",
        configure:
          "Add a real release URL with VITE_DESKTOP_APP_URL.",
      },
      desktop: {
        badge: "Windows",
        title: "PC",
        description:
          "Offer the Windows installer directly, or let users install the web app from the browser today.",
        help:
          "When no desktop URL is configured, supported desktop browsers can still fall back to the current install flow.",
      },
    },
    convert: {
      eyebrow: "Desktop release",
      title: "The web app is now focused on the desktop distribution flow",
      description:
        "The release flow now stays centered on the Windows desktop shell and the browser install path, without maintaining separate native mobile wrappers.",
      steps: [
        "Build the Windows package with npm run desktop:build.",
        "Upload the installer or portable build from the release folder.",
        "Point VITE_DESKTOP_APP_URL to the public download link.",
        "Keep browser install available as a fallback when needed.",
      ],
      notes: [
        "The desktop shell opens the production web app URL instead of shipping private server secrets.",
        "The release folder contains the installer, the portable build, and the unpacked fallback archive.",
        "VITE_DESKTOP_APP_URL controls the PC download button on this screen.",
      ],
    },
    flow: {
      eyebrow: "Usage flow",
      title: "Where the app makes your workflow cleaner",
      description:
        "Once installed, HotsNew can stand on its own as a real work tool instead of being just another browser tab buried among many others.",
      useCases: [
        "Open HotsNew as a standalone app, separate from the browser.",
        "Reduce the time spent finding the right working tab while handling many links.",
        "Fit for operators who need to re-open the dashboard throughout the day.",
      ],
      preview: {
        eyebrow: "App mode",
        title: "HotsNew workspace",
        currentWorkspace: "Current workspace",
        currentWorkspaceValue: "LG House · owner",
        actionLabel: "Action",
        actionValue: "Create link",
        accessLabel: "Access",
        accessValue: "One-tap open",
      },
    },
    surfaces: {
      title: "Install the HotsNew app",
      description:
        "Use this when you want the workspace to behave like a real tool, easier to reach and less dependent on browser tabs.",
      items: [
        {
          title: "Desktop",
          body: "Create a dedicated work window for HotsNew so daily actions stay focused.",
        },
        {
          title: "Mobile",
          body: "Pin it to the home screen to open the workspace quickly like a real app.",
        },
      ],
    },
    workflow: {
      title: "Suggested rollout",
      description:
        "Keep only the necessary steps so new users can get started faster with less noise.",
      checklist: [
        "Install the app on the device you use most often.",
        "Pin the app to your desktop or home screen for faster access.",
        "Use this page as the quick onboarding step for new members.",
      ],
    },
    troubleshooting: {
      eyebrow: "Troubleshooting",
      title: "A few common situations",
      items: [
        {
          title: "You cannot see the install button",
          body: "Open the site in a recent Chrome or Coc Coc browser, then try again from the browser menu.",
        },
        {
          title: "The app is installed but hard to find",
          body: "Look for HotsNew in your app list or the shortcut you just pinned on the device.",
        },
        {
          title: "You want to install it on another device",
          body: "Each device needs its own install once. Just sign in to HotsNew on that device.",
        },
      ],
    },
    cta: {
      eyebrow: "Quick start",
      title: "This page now keeps only the app flow, so it feels shorter and easier to use.",
      description:
        "When onboarding a new member, just ask them to install the app and pin the access point. This flow now stays focused on the app so it is easier to understand.",
      button: "Open HotsNew in a new tab",
    },
  },
  pricing: {
    header: {
      title: "Pricing plans",
      description:
        "ZaloPay has been removed from the payment flow. The app now uses admin contact or bank transfer QR activation.",
    },
    status: {
      eyebrow: "Current status",
      free: "Free plan",
      monthly: "Monthly plan",
      yearly: "Yearly plan",
      activeUntil: "Plan active until {date}.",
      badgeFree: "Free",
      badgeActive: "Active",
      remaining: "Remaining: {duration}",
      noExpiry: "No expiry date is available for countdown display.",
      linksUnlimited: "Links: Unlimited",
      linksDaily: "Links: {used}/{limit}",
      videosUnlimited: "Unlimited video uploads per day.",
      videosDaily: "Videos today: {used}/{limit}",
    },
    countdown: {
      day: "days",
      hour: "hours",
      minute: "minutes",
      second: "seconds",
    },
    actions: {
      activate: "Contact to activate",
      renew: "Contact to renew",
      disabledYearly:
        "The yearly plan is active, so lower plans are temporarily locked.",
      disabledRenew: "Renewal is only open when the plan has 7 days or less remaining.",
    },
    metrics: {
      linksPerDay: "{value} links / day",
      videosPerDay: "{value} videos / day",
      workspaces: "{value} workspaces",
      members: "{value} members",
    },
    plans: {
      monthly: {
        name: "Monthly plan",
        price: "79,000đ",
        period: "/ MONTH",
        description: "Best for trials or short-term operations.",
        badge: "Flexible",
        features: [
          "Unlimited landing pages",
          "Video and thumbnail uploads",
          "Link management and analytics tracking",
          "Manual activation through bank QR or administrator",
        ],
      },
      yearly: {
        name: "Yearly plan",
        price: "749,000đ",
        period: "/ YEAR",
        description: "More cost efficient and better for long-term operations.",
        badge: "Better value",
        features: [
          "Unlimited landing pages",
          "Video and thumbnail uploads",
          "Link management and analytics tracking",
          "Manual activation through bank QR or administrator",
        ],
      },
    },
  },
  analytics: {
    stats: {
      redirects: "Redirects",
      shopee: "Shopee clicks",
      tiktok: "TikTok clicks",
      activeLinks: "Active links",
      growth: "30-day growth",
    },
    views: {
      basic: "Basic analytics",
      advanced: "Advanced analytics",
    },
    chart: {
      title: "Redirect chart",
      description:
        "Shopee and TikTok redirect activity over the last 30 days.",
      liveData: "Live data",
      shopee: "Shopee: {count}",
      tiktok: "TikTok: {count}",
      empty: "No redirect data in the last 30 days.",
    },
    topLinks: {
      title: "Top performing links",
      empty: "No link analytics available yet.",
      itemMeta: "{count} redirects · /s/{code}",
    },
    traffic: {
      title: "Traffic sources",
      empty: "No traffic source data yet.",
    },
    overview: {
      greeting: {
        morning: "Good morning",
        afternoon: "Good afternoon",
        evening: "Good evening",
      },
      hero: {
        badge: "Performance dashboard",
        title: "{greeting}, here is the growth rhythm of your campaigns.",
      },
      summary: {
        growth: "30-day growth",
        efficiency: "Efficiency",
        recent: "Last 7 days",
        recentBest: "{count} clicks on the best day",
        recentEmpty: "No history available yet",
      },
      efficiency: {
        veryHigh: {
          label: "Very high",
          note: "Each link is pulling strong traffic right now.",
        },
        high: {
          label: "High",
          note: "Outbound performance is staying above a healthy baseline.",
        },
        medium: {
          label: "Balanced",
          note: "The baseline is stable, with room to optimize further.",
        },
        rising: {
          label: "Rising",
          note: "Signals are starting to appear. Push CTA and distribution more.",
        },
        empty: {
          label: "Not yet",
          note: "Create more links or drive initial traffic into the system.",
        },
      },
      growthLabels: {
        sprinting: "Sprinting",
        stable: "Stable",
        optimize: "Needs optimization",
      },
      metrics: {
        totalLinks: "Total links",
        outboundClicks: "Outbound clicks",
        toShopee: "To Shopee",
        toTiktok: "To TikTok",
        totalLinksDetail: "{avg} average clicks per link",
        totalLinksEmpty: "Create your first link to unlock data",
        outboundDetail: "Total outbound clicks sent to destinations",
        outboundEmpty: "No outbound session has been recorded yet",
        marketplaceShare: "{share}% of total outbound",
        shopeeEmpty: "No traffic to Shopee has been recorded yet",
        tiktokEmpty: "No traffic to TikTok has been recorded yet",
      },
      recent: {
        eyebrow: "Recent click rhythm",
        title: "Outbound trend by day",
        emptyTitle: "Data will appear once new clicks arrive",
        action: "Open analytics",
        chartEmpty:
          "The system does not have enough recent click data to build a trend yet.",
      },
      trafficDistribution: {
        eyebrow: "Traffic distribution",
        shopee: "Shopee",
        tiktok: "TikTok",
        other: "Other",
      },
      suggestions: {
        eyebrow: "Quick suggestion",
        noClicks:
          "Create more landing links and push initial traffic so the system can start learning click behavior.",
        missingChannel:
          "One channel still has no data. Add cross-distribution to compare performance more clearly.",
        ready:
          "You already have multi-channel data. Focus on improving the title and thumbnail of your top links to raise CTR.",
      },
      actionPanel: {
        eyebrow: "Priority action",
        title: "Create more intentional links to drive clearer performance gains.",
        description:
          "Once data is organized, the next step is to create links for each campaign or each channel so traffic quality can be measured accurately.",
        clicksPerLink: "Clicks / link",
        channelsWithData: "Channels with data",
        createNow: "Create link now",
        upgrade: "Upgrade plan",
        viewAdvanced: "View advanced analytics",
      },
      topLinks: {
        eyebrow: "Featured links",
        title: "Top performing links",
        action: "View list",
        outbound: "Outbound",
        empty: "No top-performing link data is available yet.",
      },
    },
    advanced: {
      tabs: {
        geo: "Geography",
        device: "Devices",
        time: "Time",
        notifications: "Notifications",
      },
      actions: {
        exportClicks: "Export details (CSV)",
        exportSummary: "Export summary",
        save: "Save settings",
        saving: "Saving...",
      },
      toasts: {
        settingsSaved: "Notification settings were saved.",
        settingsFailed: "Unable to save settings. Please try again.",
        exportSuccess: "CSV file downloaded.",
        exportFailed: "Unable to export data. Please try again.",
      },
      common: {
        clicks: "{count} clicks",
        noData: "No data yet",
        peakHour: "Peak: {hour}:00",
        peakDay: "Peak: {day}",
        tooltipLabel: "Clicks",
      },
      geo: {
        countries: "Countries",
        countriesCount: "{count} countries",
        countriesEmpty: "No geographic data yet",
        cities: "Cities",
        citiesCount: "{count} cities",
        citiesEmpty: "No city data yet",
      },
      device: {
        types: "Device types",
        browsers: "Browsers",
        operatingSystems: "Operating systems",
      },
      time: {
        byHour: "Hourly distribution",
        byDay: "Daily distribution",
      },
      notifications: {
        title: "Notification settings",
        toggleTitle: "Notify on clicks",
        toggleDescription: "Receive alerts through webhook or Telegram",
        thresholdLabel: "Notification threshold (0 = every click)",
        thresholdPlaceholder: "Example: 10 (notify every 10 clicks)",
        thresholdHint:
          "Set 0 to receive a notification for every click, or set N to be notified every N clicks.",
        webhookLabel: "Webhook URL",
        webhookPlaceholder: "https://your-webhook-endpoint.com/webhook",
        webhookHint: "This URL will receive a POST request when a new click arrives.",
        telegramTitle: "Telegram bot settings",
        botToken: "Bot token",
        chatId: "Chat ID",
        chatIdPlaceholder: "123456789 or @channelusername",
      },
    },
  },
  admin: {
    deleteModal: {
      title: "Confirm deletion?",
      description:
        "Are you sure you want to delete this user? All related links and data will be removed permanently.",
      cancel: "Cancel",
      confirm: "Delete now",
    },
    stats: {
      totalUsers: "Total users",
      premiumUsers: "Paid users",
      pendingUsers: "Pending approval",
      revenue: "Revenue",
    },
    header: {
      title: "User management",
      description: "Manage, approve, and monitor member activity.",
    },
    domains: {
      title: "Output domains",
      description:
        "Preselect 2-3 output domains for yearly-plan users to choose from when creating links.",
      add: "Add domain",
      save: "Save list",
      saving: "Saving...",
    },
    accessLogs: {
      title: "Access logs",
      description: "Recent access history across the entire system.",
      loading: "Loading access logs...",
      empty: "No access logs yet.",
      guest: "Guest",
      unknownIp: "Unknown IP",
      blocked: "Blocked",
    },
    ipBlock: {
      title: "IP blocking",
      description: "Block malicious or abnormal access by IP.",
      ipPlaceholder: "Example: 203.113.10.5",
      reasonPlaceholder: "Reason for blocking...",
      submit: "Block IP",
      submitting: "Blocking...",
      empty: "No blocked IPs yet.",
      noReason: "No note",
      active: "Active",
      inactive: "Removed",
      unblock: "Unblock",
    },
    filters: {
      searchPlaceholder: "Search by name or email...",
      allPlans: "All plans",
      allStatuses: "All statuses",
      approved: "Approved",
      pending: "Pending",
      showing: "Showing {shown} / {total} users",
    },
    table: {
      title: "System members",
      count: "{count} users",
      loading: "Loading users...",
      empty: "No users found.",
      unnamed: "Unnamed user",
      online: "Online",
      viewDetails: "View details",
    },
    actions: {
      approveNow: "Approve now",
      approveUser: "Approve user",
      deleteUser: "Delete user",
    },
    detail: {
      title: "User details",
      linksTitle: "User links ({count})",
      linksLoading: "Loading...",
      linksEmpty: "No links yet",
      clicks: "{count} clicks",
    },
    plans: {
      free: "Free",
      monthly: "Monthly",
      yearly: "Yearly",
    },
    statuses: {
      approved: "Approved",
      pending: "Pending",
    },
  },
  profile: {
    toasts: {
      copiedSecret: "2FA secret copied.",
      copiedUri: "2FA setup URI copied.",
    },
    header: {
      title: "Profile settings",
      description: "Manage your identity and account settings.",
      premium: "Paid member",
    },
    avatar: {
      alt: "Avatar",
      uploadTitle: "Avatar upload",
      emptyHint: "Choose JPG, PNG, or WebP to replace your avatar.",
      helper:
        "The system will automatically resize to a maximum of 512px and compress to WebP before upload.",
    },
    statusCard: {
      label: "Status",
      approved: "Active",
      pending: "Pending approval",
    },
    fields: {
      email: "Email address",
      emailHelp: "Your account identifier cannot be changed.",
      fullName: "Full name",
      fullNamePlaceholder: "Your display name...",
    },
    infoBanner: {
      title: "Personal data is protected",
      description:
        "Your information is encrypted and used only for authentication and permission management inside HotsNew Click.",
    },
    meta: {
      joined: "Joined",
      verified: "Verified",
      verifiedValue: "Validated",
      unknown: "---",
    },
    actions: {
      save: "Save changes",
      verifiedNote: "All information has been verified",
    },
    security: {
      title: "Account security",
      description: "Enable 2FA/TOTP and review recent access history.",
      enabled: "2FA enabled",
      disabled: "2FA disabled",
      totpTitle: "Two-factor authentication (TOTP)",
      totpDescription:
        "Use Google Authenticator, 1Password, or Authy to generate 6-digit codes.",
      qrSetup: "QR setup",
      qrHint: "Scan this code with Google Authenticator.",
      secretTitle: "Setup secret",
      secretHint:
        "If you cannot scan the QR code, you can enter the secret manually into Google Authenticator.",
      copy: "Copy",
      copyUri: "Copy URI",
      howToTitle: "How to enable 2FA",
      howToSteps: [
        "1. Click create 2FA secret.",
        "2. Scan the QR code or enter the secret into Google Authenticator.",
        "3. Take the 6-digit code currently shown in Google Authenticator and enter it below.",
        "4. Click verify to enable 2FA.",
      ],
      createFirst:
        "Click Create 2FA secret first. Only then will Google Authenticator generate a 6-digit code for you to enter.",
      codeLabel: "6-digit verification code",
      codeRefresh: "Refresh in {seconds}s",
      codePlaceholderDisable: "Enter the current code to disable 2FA",
      codePlaceholderEnable:
        "Enter the code currently shown in Google Authenticator",
      codePlaceholderCreate: "Create the 2FA secret first",
      codeHelpEnabled:
        "This is the current 6-digit code from Google Authenticator used to confirm disabling 2FA or pass verification during sign-in.",
      codeHelpSetup:
        "Do not guess a number. You must enter the exact 6-digit code currently generated in Google Authenticator after scanning the QR code or entering the secret.",
      codeHelpCreate:
        "Google Authenticator will generate the 6-digit code only after the secret is created.",
      codeIncomplete: "Please enter the full 6-digit OTP from Google Authenticator.",
      createSecret: "Create 2FA secret",
      enable: "Verify and enable 2FA",
      disable: "Disable 2FA",
      lastVerified: "Last verification: {date}",
      noVerification: "No 2FA verification has been recorded yet.",
    },
    accessLogs: {
      title: "Recent security activity",
      description: "Your own recent access history.",
      loading: "Loading access history...",
      empty: "No access logs yet.",
      unknownIp: "Unknown IP",
      devices: {
        unknown: "Unknown device",
        ios: "iPhone / iPad",
        android: "Android phone",
        windows: "Windows computer",
        mac: "Mac computer",
        other: "Other browser",
      },
      statuses: {
        review: "Needs review",
        normal: "Normal",
      },
      summaries: {
        setup: {
          title: "You created a 2FA secret",
          description:
            "The system prepared a secret key so you can enable two-factor authentication.",
        },
        enable: {
          title: "You enabled two-factor authentication",
          description: "Your account now has an additional security layer.",
        },
        disable: {
          title: "You disabled two-factor authentication",
          description:
            "Your account no longer requires a 2FA code at sign-in.",
        },
        challenge: {
          title: "You completed 2FA verification",
          description:
            "The two-factor verification code was checked for the current session.",
        },
        workspaceInvites: {
          title: "You viewed workspace invitations",
          description:
            "The system loaded the list of pending team invitations.",
        },
        workspaceMembers: {
          title: "You viewed workspace members",
          description: "The member list for the workspace was opened.",
        },
        workspaces: {
          title: "You opened the team area",
          description:
            "The system loaded your workspaces and your current permissions.",
        },
        stats: {
          title: "You viewed analytics",
          description: "Workspace analytics data was loaded.",
        },
        quota: {
          title: "You checked link quota",
          description:
            "The system checked how many link creations remain for today.",
        },
        limits: {
          title: "You checked account limits",
          description:
            "The system checked the limits of your current plan.",
        },
        linksRead: {
          title: "You opened the link list",
          description: "Your link list was loaded.",
        },
        linksWrite: {
          title: "You performed a link action",
          description:
            "The system recorded an action related to your links.",
        },
        notifications: {
          title: "You opened notifications",
          description: "The in-app notification inbox was loaded.",
        },
        profile: {
          title: "You opened your profile",
          description: "Your personal profile information was loaded.",
        },
        security: {
          title: "You opened security settings",
          description:
            "The system loaded recent account security information.",
        },
        generic: {
          title: "You accessed a feature in the system",
          description:
            "The system recorded a recent activity for this account.",
        },
      },
    },
    common: {
      unnamed: "Unnamed user",
    },
  },
  linkList: {
    filters: {
      usagePlaceholder: "Choose usage placement",
      usageFacebookPost: "Facebook post",
      usageFacebookReel: "Facebook reel",
      usageTikTokBio: "TikTok bio",
      usageTikTokVideo: "TikTok video",
      usageZalo: "Zalo OA",
      usageSeeding: "Seeding group",
      usageLivestream: "Livestream",
      all: "All",
      choice: "Two-step mode",
      video: "Has video",
      tiktok: "Has TikTok",
      expiring: "Expiring soon",
      top: "High clicks",
      quick: "Quick filters",
    },
    hero: {
      badge: "Compact Pro",
      title: "Manage links",
      searchPlaceholder: "Search by title, code, source, tag...",
      description:
        "Showing {shown}/{total} assets. This layout prioritizes faster scanning, quicker actions, and denser display.",
    },
    stats: {
      total: "Total links",
      totalNote: "{shown} currently shown",
      shopee: "Shopee clicks",
      shopeeNote: "Primary outbound",
      tiktok: "TikTok clicks",
      tiktokNote: "Secondary flow",
      choice: "Two-step mode",
      choiceNote: "Links with step 2",
      expiring: "Expiring soon",
      expiringNote: "Avg {count} clicks/link",
    },
    bulk: {
      deselectVisible: "Deselect visible",
      selectVisible: "Select visible",
      selected: "{count} links selected",
      current: "Current: {selected}/{total}",
      delete: "Delete {count} links",
      hint: "Select multiple links for quick actions.",
      confirmTitle: "Confirm deleting {count} links?",
      confirmDescription:
        "This action will permanently delete {count} links and all analytics data. It cannot be undone.",
      confirmAction: "Delete {count} links permanently",
      cancel: "Cancel",
    },
    empty: {
      noLinks: "No links have been created yet.",
      noResults: "No links match the current filter.",
      hint: "Try another search term or filter.",
    },
    card: {
      untitled: "Untitled link",
      createdAgo: "{time} ago",
      totalClicks: "Total {count}",
      protected: "Protected",
      secondaryTikTok: "Shopee to TikTok",
      secondaryShopee: "Shopee to Shopee",
      stepTwo: "Step 2",
      unknown: "Unknown",
      edit: "Edit",
      delete: "Delete link",
      editShort: "Edit",
      deleteShort: "Delete",
      copy: "Copy",
      copied: "Done",
      qr: "QR code",
      choiceLanding: "Open landing page for two-step mode",
    },
    editModal: {
      title: "Edit link",
      originalUrl: "Original URL",
      originalHelp: "The real destination users will be redirected to.",
      titleField: "Title",
      titlePlaceholder: "Displayed title...",
      descriptionField: "Description",
      descriptionPlaceholder: "Content description...",
      usageField: "Used where",
      folderField: "Campaign folder",
      folderPlaceholder: "sale-6-6, remarketing...",
      tagsField: "Tags",
      tagsPlaceholder: "facebook, retarget, campaign-a",
      tagsHelp: "Separate multiple tags with commas.",
      thumbnailField: "Thumbnail URL",
      expiresField: "Link expiry",
      expiresNone: "No expiry",
      expiresDay: "{count} days",
      expiresHelp: "The link will be disabled automatically after the selected time.",
      secondaryField: "Secondary URL",
      cancel: "Cancel",
      save: "Save changes",
    },
    deleteModal: {
      title: "Confirm deleting this link?",
      description:
        "This action will permanently delete link {code} and all analytics data. It cannot be undone.",
      confirm: "Delete permanently",
      cancel: "Cancel",
    },
    qrModal: {
      title: "Your QR code",
      hint: "Scan to open the link",
      download: "Download QR code (.png)",
    },
  },
  createLink: {
    validation: {
      primaryRequired: "Please enter the original Shopee or TikTok URL.",
      primaryInvalid:
        "The original URL must be a valid Shopee or TikTok domain.",
      titleRequired: "Please enter a display title.",
      descriptionRequired: "Please enter a post description.",
      imageOrVideoRequired:
        "Please provide a thumbnail URL or upload a video.",
      videoOrImageRequired:
        "Please upload a video or provide a thumbnail URL.",
      shortCodeMin: "The short code must be at least 3 characters.",
      shortCodeMax: "The short code cannot exceed {max} characters.",
      secondaryNeedsVideo:
        "The step-2 URL can only be used after a video has been uploaded.",
      secondaryShopeeInvalid:
        "The step-2 URL must be a valid Shopee domain.",
      secondaryTiktokInvalid:
        "The step-2 URL must be a valid TikTok domain.",
      secondarySameShopee:
        "The step-2 URL must use the same Shopee domain as the original Shopee link when Shopee mode is selected.",
      redirectDelayRange: "Delay must be between 1 and 10 seconds.",
      dropVideo: "Please drop a valid video file.",
      dropImage: "Please drop a valid image file for the thumbnail.",
    },
    page: {
      title: "Create a new landing page",
      description:
        "The system will automatically fetch data and optimize the preview for Facebook.",
      closeError: "Close notice",
      sectionEyebrow: "Link setup",
      formTitle: "Shorten link",
      quotaExhausted: "No quota left today",
      submit: "Shorten link",
      originalLabel: "Original Shopee / TikTok URL",
      originalPlaceholder: "Paste a Shopee or TikTok product link...",
      originalHelp:
        "Shopee and TikTok domains are supported to keep the conversion flow stable.",
      titleLabel: "Custom title",
      titlePlaceholder: "Displayed title...",
      descriptionLabel: "Post description",
      descriptionPlaceholder: "Description that drives clicks...",
      shortCodeLabel: "Custom short code",
      shortCodePlaceholder: "Example: toi-yeu-em",
      previewPrefix: "Resulting link:",
      previewFallback: "your-short-code",
      shortCodeMax: "Maximum {max} characters.",
      advancedTitle: "Advanced settings",
      advancedDescription:
        "Output domain, UTM, affiliate, A/B test, expiration, and step-2 flow.",
      marketingTitle: "Marketing & Growth",
      marketingDescription:
        "Attach UTM automatically, output links on custom domains, and prepare growth data from the start.",
      customDomainLocked:
        "Choosing an output domain is only available for yearly plans or administrators.",
      defaultDomain: "Default domain: hotsnew.click",
      contactUpgrade: "Contact Zalo to upgrade",
      adminPlan: "Administrator",
      yearlyPlan: "Yearly plan",
      monthlyPlan: "Monthly plan",
      freePlan: "Free plan",
      unlimitedLinks: "Links: Unlimited",
      linksQuota: "Links: {used}/{limit}",
      unlimitedVideos: "Videos: Unlimited",
      videosQuota: "Videos: {used}/{limit}",
      campaignToggleTitle: "Campaign tracking (UTM)",
      campaignToggleDescription:
        "Attach UTM parameters so you know whether clicks came from Facebook, TikTok, or Zalo.",
      campaignEnabled: "Enabled",
      campaignDisabled: "Disabled",
      utmSourceLabel: "Traffic source",
      utmSourcePlaceholder: "Example: facebook",
      utmSourceHelp: "The system automatically appends utm_medium=social.",
      utmCampaignLabel: "Campaign name",
      utmCampaignPlaceholder: "Example: sale-6-6 or me-bim-thang-5",
      utmCampaignHelp:
        "Only fill this in when you want to measure a specific campaign.",
      affiliateTitle: "Affiliate integration",
      affiliateDescription:
        "Enter affiliate query params so the system can append them to matching Shopee or TikTok links automatically.",
      shopeeAffiliatePlaceholder: "Shopee: af_id=123&sub_id=campaign-a",
      tiktokAffiliatePlaceholder: "TikTok: aff_id=456&sub_id=creator-b",
      usageLabel: "Usage placement",
      usageFacebookPost: "Facebook post",
      usageFacebookReel: "Facebook reel",
      usageTikTokBio: "TikTok bio",
      usageTikTokVideo: "TikTok video",
      usageZalo: "Zalo OA",
      usageSeeding: "Seeding group",
      usageLivestream: "Livestream",
      folderLabel: "Campaign folder",
      folderPlaceholder: "sale-6-6, remarketing, koc...",
      folderHelp: "Group links by campaign, team, or selling season.",
      tagsLabel: "Tags",
      tagsPlaceholder: "facebook, retarget, campaign-a",
      tagsHelp: "Separate multiple tags with commas for easier search and filtering later.",
      expiryLabel: "Link expiration",
      expiryNever: "No expiry",
      expiry1d: "1 day",
      expiry3d: "3 days",
      expiry7d: "7 days",
      expiry15d: "15 days",
      expiry30d: "30 days",
      expiryHelp: "The link will automatically be disabled after the selected time.",
      secondaryTitle: "Two-step protection flow",
      secondaryDescription:
        "Open the main link first. Then the viewer clicks once more on the landing page to open the step-2 link inside the same protected flow.",
      secondaryWarning:
        "Use Shopee mode only when the original link and step-2 link share the same affiliate source. If you choose TikTok, step 2 will open TikTok on the next click.",
      secondaryTargetLabel: "What should step 2 open?",
      secondaryTargetShopee: "Shopee",
      secondaryTargetTikTok: "TikTok",
      secondaryUrlLabel: "Step-2 URL",
      secondaryUrlPlaceholderShopee: "https://shopee.vn/...",
      secondaryUrlPlaceholderTikTok: "https://www.tiktok.com/...",
      secondaryUrlHelpDisabled:
        "Upload a video first before enabling the step-2 URL.",
      secondaryUrlHelpEmpty: "Leave empty if you only want the standard single-link flow.",
      secondaryUrlHelpShopeeOnly: "Shopee domains only.",
      secondaryUrlHelpTikTokOnly: "TikTok domains only.",
      abTitle: "A/B testing",
      abDescription:
        "Split traffic 50/50 between the current variant A and variant B to test landing content or conversion targets.",
      abToggleOn: "A/B on",
      abToggleOff: "A/B off",
      abLocked: "A/B testing is currently available only for yearly plans or administrators.",
      abVariantBTitlePlaceholder: "Variant B title",
      abVariantBUrlPlaceholder: "Variant B primary URL",
      abVariantBDescriptionPlaceholder: "Variant B description",
      abVariantBImagePlaceholder: "Variant B image URL",
      abVariantBVideoPlaceholder: "Variant B video URL",
      abVariantBSecondaryPlaceholder: "Variant B step-2 URL",
      videoLabel: "Attach video (optional)",
      videoUploading: "Uploading video...",
      videoPreparing: "Preparing video...",
      videoReplace: "Replace video",
      videoUpload: "Upload video to Cloudinary",
      videoDropHelp: "Drag and drop a video here, or click to browse.",
      videoQuotaUnlimited: "Your current plan supports unlimited daily video uploads.",
      videoQuotaRemaining:
        "You have {remaining} / {limit} video uploads left today.",
      videoQuotaUnsupported: "Your current plan does not support video uploads.",
      videoQuotaExhausted: "You have used all video upload quota for today.",
      videoUploadSuccess: "Video uploaded to cloud storage successfully!",
      thumbnailLabel: "Thumbnail",
      thumbnailUploading: "Uploading thumbnail image...",
      thumbnailSelect: "Choose thumbnail from device",
      thumbnailDropHelp:
        "You can drag an image here, or click to choose one from your device.",
      thumbnailUploadSuccess: "Thumbnail uploaded successfully",
      thumbnailUrlPlaceholder: "Cover image URL...",
      thumbnailPreviewAlt: "Thumbnail preview",
    },
    result: {
      review: "Preview mode",
      previewImageAlt: "Preview image",
      previewEmpty: "No preview image yet",
      previewTitleFallback: "Your title will appear here...",
      previewDescriptionFallback:
        "The system will automatically create a landing page with video and a professional title like a real editorial page.",
      codeLabel: "Link code: {code}",
      copyLink: "Copy link",
      qr: "QR code",
    },
    qrModal: {
      title: "QR code",
      description: "Scan to access the link",
      close: "Close",
      download: "Download",
    },
    feedback: {
      upgradeRequired:
        "Please upgrade your account to use the link creation feature.",
      shortCodeMax: "The short code cannot exceed {max} characters.",
      conversionFailed: "Link creation failed.",
      success: "Link shortened successfully: {url}",
    },
  },
  workspace: {
    roles: {
      owner: "Owner",
      editor: "Editor",
      viewer: "Viewer",
    },
    hero: {
      badge: "Workspace team",
      title: "Lean teams, clear roles, faster actions.",
      description:
        "Keep only the parts that matter for managing workspaces, invites, and members in one compact screen.",
      stats: {
        teamWorkspaces: "Team workspaces",
        members: "Members",
        pendingInvites: "Pending invites",
      },
      currentWorkspace: {
        eyebrow: "Current workspace",
        emptyTitle: "No workspace selected",
        emptyDescription: "Choose a workspace to start managing the team.",
        personal: "Personal",
        team: "Team",
        membersSuffix: "members",
        pendingInvitesSuffix: "pending invites",
      },
    },
    sections: {
      list: {
        eyebrow: "Workspaces",
        title: "Workspace list",
        loading: "Loading workspaces...",
        active: "Active",
        personal: "Personal",
        team: "Team",
        noDescription: "No description yet.",
      },
      create: {
        eyebrow: "Create workspace",
        description: "Split out a new team or campaign.",
        namePlaceholder: "Workspace name",
        descriptionPlaceholder: "Short description",
        submit: "Create workspace",
      },
      incomingInvites: {
        eyebrow: "Invitations",
        title: "Team invitations",
        loading: "Loading invitations...",
        invitedBy: "Invited by {name}",
        ownerFallback: "Owner",
        accept: "Accept",
        decline: "Decline",
      },
      manageInvites: {
        eyebrow: "Invite management",
        title: "Invite members",
        emailPlaceholder: "Member email",
        invite: "Invite",
        sentTitle: "Sent invitations",
        loading: "Loading sent invitations...",
        pendingConfirmation: "{role} · waiting for confirmation",
        cancel: "Cancel",
        none: "No invitations have been sent yet.",
      },
      members: {
        eyebrow: "Members",
        title: "Member list",
        loading: "Loading members...",
        ownerBadge: "Owner",
        noEmail: "No email",
        remove: "Remove",
        none: "There are no members in this workspace yet.",
        avatarAlt: "Member avatar",
      },
      roles: {
        editor: "Editor",
        viewer: "Viewer",
      },
      warnings: {
        noWorkspaceSupport:
          "Your current plan does not support team workspaces.",
        workspaceLimit: "You have used all {limit} team workspaces.",
        noMemberSupport:
          "Your current plan does not support member invitations.",
        memberLimit: "This workspace has used all {limit} member slots.",
        ownerOnly:
          "Only the owner can add members or change permissions. Your current role is {role}.",
      },
    },
  },
} as const;
