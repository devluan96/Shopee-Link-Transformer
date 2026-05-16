import React, { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Eye,
  EyeOff,
  Fingerprint,
  Layers3,
  Loader2,
  Lock,
  Mail,
  Play,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale } from "@/src/hooks/useLocale";
import { cn } from "@/src/lib/utils";

interface AuthScreenProps {
  isRegistering: boolean;
  setIsRegistering: (val: boolean) => void;
  loginEmail: string;
  setLoginEmail: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  registerEmail: string;
  setRegisterEmail: (val: string) => void;
  registerPassword: string;
  setRegisterPassword: (val: string) => void;
  registerConfirmPassword: string;
  setRegisterConfirmPassword: (val: string) => void;
  rememberMe: boolean;
  setRememberMe: (val: boolean) => void;
  passwordRecoveryMode: boolean;
  recoveryPassword: string;
  setRecoveryPassword: (val: string) => void;
  recoveryConfirmPassword: string;
  setRecoveryConfirmPassword: (val: string) => void;
  loading: boolean;
  authError: string | null;
  authNotice: string | null;
  handleEmailAuth: (e: React.FormEvent) => void;
  handleForgotPassword: () => void | Promise<void>;
  handlePasswordRecovery: (e: React.FormEvent) => void | Promise<void>;
  resetLoading?: () => void;
}

interface AuthFormProps {
  isRegistering: boolean;
  setIsRegistering: (val: boolean) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  confirmPassword?: string;
  setConfirmPassword?: (val: string) => void;
  rememberMe: boolean;
  setRememberMe: (val: boolean) => void;
  passwordRecoveryMode?: boolean;
  recoveryPassword: string;
  setRecoveryPassword: (val: string) => void;
  recoveryConfirmPassword: string;
  setRecoveryConfirmPassword: (val: string) => void;
  loading: boolean;
  authError: string | null;
  authNotice: string | null;
  handleEmailAuth: (e: React.FormEvent) => void;
  handleForgotPassword: () => void | Promise<void>;
  handlePasswordRecovery: (e: React.FormEvent) => void | Promise<void>;
  resetLoading?: () => void;
}

const featureIcons = [Layers3, BarChart3, Fingerprint] as const;

export const AuthScreen = ({
  isRegistering,
  setIsRegistering,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  registerEmail,
  setRegisterEmail,
  registerPassword,
  setRegisterPassword,
  registerConfirmPassword,
  setRegisterConfirmPassword,
  rememberMe,
  setRememberMe,
  passwordRecoveryMode,
  recoveryPassword,
  setRecoveryPassword,
  recoveryConfirmPassword,
  setRecoveryConfirmPassword,
  loading,
  authError,
  authNotice,
  handleEmailAuth,
  handleForgotPassword,
  handlePasswordRecovery,
  resetLoading,
}: AuthScreenProps) => {
  const { messages, t } = useLocale();
  const auth = messages.auth;

  return (
    <div className="relative h-dvh overflow-hidden bg-[#f3eee7] text-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,128,0,0.15),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(15,23,42,0.08),transparent_22%),linear-gradient(135deg,#f8f1e7_0%,#f5efe8_44%,#fbfaf8_100%)]" />
      <div className="absolute -left-40 -top-32 h-72 w-72 rounded-full bg-orange-300/20 blur-3xl" />
      <div className="absolute -bottom-48 -right-32 h-80 w-80 rounded-full bg-slate-900/8 blur-3xl" />
      <div className="absolute inset-y-0 left-[46%] hidden w-px bg-white/40 lg:block" />

      <div className="relative z-10 h-full">
        <div className="grid h-full lg:grid-cols-[1.02fr_0.98fr]">
        <section className="hidden px-6 py-6 lg:flex xl:px-8 xl:py-7">
          <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[2.4rem] border border-white/60 bg-[#1d160f] px-8 py-7 text-white shadow-[0_30px_100px_rgba(24,16,8,0.28)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,181,71,0.22),transparent_24%),radial-gradient(circle_at_78%_22%,rgba(255,255,255,0.08),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0)_28%)]" />

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
              className="relative flex h-full flex-col"
            >
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-orange-200 backdrop-blur">
                <Sparkles size={14} className="text-orange-300" />
                {auth.hero.badge}
              </div>

              <div className="max-w-xl">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.34em] text-orange-200/80">
                  {auth.hero.eyebrow}
                </p>
                <h1 className="text-[2.7rem] font-bold leading-[1.04] tracking-[-0.035em] xl:text-[3.3rem]">
                  {auth.hero.title}
                  <span className="block bg-[linear-gradient(135deg,#fff6ea_0%,#ffb457_45%,#ff6a00_100%)] bg-clip-text text-transparent">
                    {auth.hero.accent}
                  </span>
                </h1>
                <p className="mt-4 max-w-lg text-sm leading-6 text-white/70 xl:text-[15px]">
                  {auth.hero.description}
                </p>
              </div>

              <div className="mt-5 grid gap-3 xl:grid-cols-3">
                {auth.hero.features.map((item, index) => {
                  const Icon = featureIcons[index] ?? Layers3;
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.14 + index * 0.06, duration: 0.5 }}
                      className="rounded-[1.45rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.05))] p-4 backdrop-blur"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-400/16 text-orange-200">
                        <Icon size={18} />
                      </div>
                      <h3 className="mt-3 text-base font-semibold tracking-[-0.02em] text-white">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-5 text-white/62">
                        {item.detail}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.65 }}
                className="relative mt-5 overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#f7f3ee] p-4 text-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
              >
                <div className="relative flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
                      {auth.hero.preview.eyebrow}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold tracking-[-0.025em]">
                      {auth.hero.preview.title}
                    </h3>
                  </div>
                  <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm xl:block">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                      {auth.hero.preview.statLabel}
                    </p>
                    <p className="mt-1 text-xl font-semibold tracking-[-0.025em] text-orange-600">
                      +27.4%
                    </p>
                  </div>
                </div>

                <div className="relative mt-4 overflow-hidden rounded-[1.3rem] border border-slate-200 bg-white">
                  <img
                    src="./og-image.png"
                    alt={auth.hero.preview.imageAlt}
                    className="h-48 w-full object-cover object-top xl:h-52"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.72))] p-4">
                    <div className="text-white">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/65">
                        {auth.hero.preview.demoLabel}
                      </p>
                      <p className="mt-1.5 text-lg font-semibold tracking-[-0.025em]">
                        {auth.hero.preview.demoTitle}
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/12 text-white backdrop-blur">
                      <Play size={15} className="translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="flex h-full items-center justify-center overflow-hidden px-4 py-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="w-full max-w-132">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-4 flex items-center justify-between gap-4 rounded-[1.45rem] border border-white/70 bg-white/65 px-4 py-3 shadow-[0_20px_60px_rgba(82,56,20,0.08)] backdrop-blur"
            >
              <div className="flex items-center gap-3.5">
                <img
                  src="/logo-app-192.png"
                  alt={t("sidebar.logoAlt")}
                  className="h-12 w-12 rounded-xl border border-orange-100 object-cover shadow-sm"
                />
                <div>
                  <p className="text-xl font-bold tracking-[-0.03em] text-slate-950">
                    HotsNew <span className="text-orange-600">Click</span>
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
                    {auth.topbar.tagline}
                  </p>
                </div>
              </div>
              <div className="hidden shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 sm:inline-flex sm:items-center sm:gap-1.5 sm:whitespace-nowrap">
                <ShieldCheck size={13} />
                {auth.topbar.security}
              </div>
            </motion.div>
            {passwordRecoveryMode ? (
              <AuthFormPanel
                isRegistering={false}
                setIsRegistering={setIsRegistering}
                email={loginEmail}
                setEmail={setLoginEmail}
                password={loginPassword}
                setPassword={setLoginPassword}
                rememberMe={rememberMe}
                setRememberMe={setRememberMe}
                passwordRecoveryMode
                recoveryPassword={recoveryPassword}
                setRecoveryPassword={setRecoveryPassword}
                recoveryConfirmPassword={recoveryConfirmPassword}
                setRecoveryConfirmPassword={setRecoveryConfirmPassword}
                loading={loading}
                authError={authError}
                authNotice={authNotice}
                handleEmailAuth={handleEmailAuth}
                handleForgotPassword={handleForgotPassword}
                handlePasswordRecovery={handlePasswordRecovery}
                resetLoading={resetLoading}
              />
            ) : (
              <div
                className="relative h-140 sm:h-144"
                style={{ perspective: "1800px" }}
              >
                <motion.div
                  initial={false}
                  animate={{ rotateY: isRegistering ? 180 : 0 }}
                  transition={{
                    duration: 0.6,
                    type: "spring",
                    stiffness: 260,
                    damping: 24,
                  }}
                  style={{ transformStyle: "preserve-3d" }}
                  className="relative h-full w-full"
                >
                  <div
                    style={{ backfaceVisibility: "hidden" }}
                    className={cn(
                      "absolute inset-0",
                      isRegistering && "pointer-events-none",
                    )}
                  >
                    <AuthFormPanel
                      isRegistering={false}
                      setIsRegistering={setIsRegistering}
                      email={loginEmail}
                      setEmail={setLoginEmail}
                      password={loginPassword}
                      setPassword={setLoginPassword}
                      rememberMe={rememberMe}
                      setRememberMe={setRememberMe}
                      recoveryPassword={recoveryPassword}
                      setRecoveryPassword={setRecoveryPassword}
                      recoveryConfirmPassword={recoveryConfirmPassword}
                      setRecoveryConfirmPassword={setRecoveryConfirmPassword}
                      loading={loading}
                      authError={authError}
                      authNotice={authNotice}
                      handleEmailAuth={handleEmailAuth}
                      handleForgotPassword={handleForgotPassword}
                      handlePasswordRecovery={handlePasswordRecovery}
                      resetLoading={resetLoading}
                    />
                  </div>

                  <div
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                    className={cn(
                      "absolute inset-0",
                      !isRegistering && "pointer-events-none",
                    )}
                  >
                    <AuthFormPanel
                      isRegistering
                      setIsRegistering={setIsRegistering}
                      email={registerEmail}
                      setEmail={setRegisterEmail}
                      password={registerPassword}
                      setPassword={setRegisterPassword}
                      confirmPassword={registerConfirmPassword}
                      setConfirmPassword={setRegisterConfirmPassword}
                      rememberMe={rememberMe}
                      setRememberMe={setRememberMe}
                      recoveryPassword={recoveryPassword}
                      setRecoveryPassword={setRecoveryPassword}
                      recoveryConfirmPassword={recoveryConfirmPassword}
                      setRecoveryConfirmPassword={setRecoveryConfirmPassword}
                      loading={loading}
                      authError={authError}
                      authNotice={authNotice}
                      handleEmailAuth={handleEmailAuth}
                      handleForgotPassword={handleForgotPassword}
                      handlePasswordRecovery={handlePasswordRecovery}
                      resetLoading={resetLoading}
                    />
                  </div>
                </motion.div>
              </div>
            )}

            <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
              {auth.footer}
            </p>
          </div>
        </section>
        </div>
      </div>
    </div>
  );
};

const AuthFormPanel = ({
  isRegistering,
  setIsRegistering,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  rememberMe,
  setRememberMe,
  passwordRecoveryMode = false,
  recoveryPassword,
  setRecoveryPassword,
  recoveryConfirmPassword,
  setRecoveryConfirmPassword,
  loading,
  authError,
  authNotice,
  handleEmailAuth,
  handleForgotPassword,
  handlePasswordRecovery,
  resetLoading,
}: AuthFormProps) => {
  const { messages } = useLocale();
  const auth = messages.auth;
  const [showPrimaryPassword, setShowPrimaryPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRecoveryPassword, setShowRecoveryPassword] = useState(false);
  const [showRecoveryConfirmPassword, setShowRecoveryConfirmPassword] =
    useState(false);

  const title = passwordRecoveryMode
    ? auth.panel.titles.recovery
    : isRegistering
      ? auth.panel.titles.register
      : auth.panel.titles.login;

  const subtitle = passwordRecoveryMode
    ? auth.panel.subtitles.recovery
    : isRegistering
      ? auth.panel.subtitles.register
      : auth.panel.subtitles.login;

  const confirmPasswordMismatch =
    isRegistering &&
    (confirmPassword ?? "").trim().length > 0 &&
    password !== (confirmPassword ?? "");

  const statusChipClassName = passwordRecoveryMode
    ? "border-amber-200 bg-amber-50 text-amber-700 shadow-[0_8px_18px_rgba(245,158,11,0.10)]"
    : isRegistering
      ? "border-sky-200 bg-sky-50 text-sky-700 shadow-[0_8px_18px_rgba(14,165,233,0.10)]"
      : "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-[0_8px_18px_rgba(16,185,129,0.10)]";

  const statusChipLabel = passwordRecoveryMode
    ? auth.panel.chips.recovery
    : isRegistering
      ? auth.panel.chips.register
      : auth.panel.chips.login;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
      className="relative h-full overflow-hidden rounded-[1.95rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.78))] p-5 shadow-[0_30px_80px_rgba(82,56,20,0.11)] backdrop-blur xl:p-6"
    >
      <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,132,0,0.12),transparent_72%)]" />

      <div className="relative flex h-full flex-col">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-orange-700">
              <BadgeCheck size={13} />
              {passwordRecoveryMode
                ? auth.panel.badges.recovery
                : auth.panel.badges.default}
            </div>
            <h2 className="mt-3 text-[1.8rem] font-bold tracking-[-0.03em] text-slate-950 sm:text-[2rem]">
              {title}
            </h2>
            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              {subtitle}
            </p>
          </div>

          <div className="hidden sm:block">
            <div
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-bold",
                statusChipClassName,
              )}
            >
              <BadgeCheck size={15} />
              <span>{statusChipLabel}</span>
            </div>
          </div>
        </div>

        {!passwordRecoveryMode && (
          <div className="mb-5 rounded-[1.35rem] border border-slate-200/80 bg-slate-100/80 p-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { key: "login", label: auth.panel.tabs.login },
                { key: "register", label: auth.panel.tabs.register },
              ].map((item) => {
                const active =
                  (item.key === "login" && !isRegistering) ||
                  (item.key === "register" && isRegistering);

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setIsRegistering(item.key === "register")}
                    className={cn(
                      "relative rounded-[1.1rem] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] transition-colors",
                      active
                        ? "text-slate-950"
                        : "text-slate-400 hover:text-slate-700",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="auth-mode-pill"
                        className="absolute inset-0 rounded-[1.1rem] bg-white shadow-[0_10px_20px_rgba(15,23,42,0.08)]"
                        transition={{
                          type: "spring",
                          stiffness: 320,
                          damping: 28,
                        }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <form
          onSubmit={
            passwordRecoveryMode ? handlePasswordRecovery : handleEmailAuth
          }
          className="flex flex-1 flex-col space-y-3.5"
        >
          <InputField
            label={auth.panel.fields.email}
            icon={<Mail size={18} />}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder={auth.panel.placeholders.email}
            readOnly={passwordRecoveryMode}
          />

          <AnimatePresence mode="wait">
            {passwordRecoveryMode ? (
              <motion.div
                key="recovery-fields"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
                className="space-y-3.5"
              >
                <PasswordField
                  label={auth.panel.fields.newPassword}
                  value={recoveryPassword}
                  onChange={setRecoveryPassword}
                  showValue={showRecoveryPassword}
                  onToggleShow={() => setShowRecoveryPassword((prev) => !prev)}
                />
                <PasswordField
                  label={auth.panel.fields.confirmPassword}
                  value={recoveryConfirmPassword}
                  onChange={setRecoveryConfirmPassword}
                  showValue={showRecoveryConfirmPassword}
                  onToggleShow={() =>
                    setShowRecoveryConfirmPassword((prev) => !prev)
                  }
                />
              </motion.div>
            ) : (
              <motion.div
                key="auth-fields"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
                className="space-y-3.5"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="pl-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      {auth.panel.fields.password}
                    </label>
                    {!isRegistering && (
                      <button
                        type="button"
                        onClick={() => void handleForgotPassword()}
                        className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-600 transition-colors hover:text-orange-700"
                      >
                        {auth.panel.misc.forgotPassword}
                      </button>
                    )}
                  </div>

                  <div className="group relative overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-colors focus-within:border-orange-300">
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-[linear-gradient(180deg,rgba(255,132,0,0.06),transparent)]" />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-orange-600">
                      <Lock size={18} />
                    </span>
                    <input
                      type={showPrimaryPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-transparent px-12 py-3.5 pr-12 text-[15px] font-medium text-slate-950 outline-none placeholder:text-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPrimaryPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-orange-600"
                    >
                      {showPrimaryPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {isRegistering && (
                  <PasswordField
                    label={auth.panel.fields.confirmPasswordRegister}
                    value={confirmPassword ?? ""}
                    onChange={setConfirmPassword ?? (() => {})}
                    showValue={showConfirmPassword}
                    onToggleShow={() => setShowConfirmPassword((prev) => !prev)}
                    invalid={confirmPasswordMismatch}
                    errorText={
                      confirmPasswordMismatch
                        ? auth.panel.errors.confirmPasswordMismatch
                        : undefined
                    }
                  />
                )}

                {!isRegistering && (
                  <label className="flex items-center gap-3 px-1 text-sm font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                    />
                    {auth.panel.misc.rememberMe}
                  </label>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {authError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm font-medium text-rose-700"
            >
              <AlertCircle size={16} className="shrink-0" />
              <span>{authError}</span>
            </motion.div>
          )}

          {authNotice && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-start gap-3 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm font-medium leading-6 text-emerald-800"
            >
              <Mail size={16} className="mt-1 shrink-0" />
              <span>{authNotice}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "relative isolate mt-auto group flex w-full items-center justify-center gap-2 overflow-hidden rounded-[1.3rem] bg-[linear-gradient(135deg,#ff7a00_0%,#ff5a00_55%,#ff8f2d_100%)] px-5 py-3.5 text-xs font-black uppercase tracking-[0.22em] text-white shadow-[0_20px_40px_rgba(255,106,0,0.24)] transition-transform active:scale-[0.99]",
              loading && "cursor-not-allowed opacity-85",
            )}
          >
            <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_42%,rgba(255,255,255,0.08))]" />
            <span className="relative z-10 flex items-center gap-2">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : passwordRecoveryMode ? (
                auth.panel.actions.recovery
              ) : isRegistering ? (
                auth.panel.actions.register
              ) : (
                auth.panel.actions.login
              )}
              {!loading && (
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              )}
            </span>
          </button>

          {loading && resetLoading && (
            <button
              type="button"
              onClick={resetLoading}
              className="w-full text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 transition-colors hover:text-orange-600"
            >
              {auth.panel.actions.cancelLoading}
            </button>
          )}
        </form>
      </div>
    </motion.div>
  );
};

const InputField = ({
  label,
  icon,
  type,
  value,
  onChange,
  placeholder,
  readOnly = false,
}: {
  label: string;
  icon: React.ReactNode;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  readOnly?: boolean;
}) => (
  <div className="space-y-2">
    <label className="pl-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
      {label}
    </label>
    <div className="group relative overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-colors focus-within:border-orange-300">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-[linear-gradient(180deg,rgba(255,132,0,0.06),transparent)]" />
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-orange-600">
        {icon}
      </span>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={cn(
          "w-full bg-transparent px-12 py-3.5 pr-4 text-[15px] font-medium text-slate-950 outline-none placeholder:text-slate-300",
          readOnly && "cursor-not-allowed opacity-70",
        )}
      />
    </div>
  </div>
);

const PasswordField = ({
  label,
  value,
  onChange,
  showValue,
  onToggleShow,
  invalid = false,
  errorText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  showValue: boolean;
  onToggleShow: () => void;
  invalid?: boolean;
  errorText?: string;
}) => (
  <div className="space-y-2">
    <label className="pl-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
      {label}
    </label>
    <div
      className={cn(
        "group relative overflow-hidden rounded-[1.25rem] border bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-colors",
        invalid
          ? "border-rose-300 focus-within:border-rose-400"
          : "border-slate-200 focus-within:border-orange-300",
      )}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-[linear-gradient(180deg,rgba(255,132,0,0.06),transparent)]" />
      <span
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
          invalid
            ? "text-rose-400 group-focus-within:text-rose-500"
            : "text-slate-400 group-focus-within:text-orange-600",
        )}
      >
        <Lock size={18} />
      </span>
      <input
        type={showValue ? "text" : "password"}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••"
        className="w-full bg-transparent px-12 py-3.5 pr-12 text-[15px] font-medium text-slate-950 outline-none placeholder:text-slate-300"
      />
      <button
        type="button"
        onClick={onToggleShow}
        className={cn(
          "absolute right-4 top-1/2 -translate-y-1/2 transition-colors",
          invalid
            ? "text-rose-400 hover:text-rose-500"
            : "text-slate-400 hover:text-orange-600",
        )}
      >
        {showValue ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
    {errorText && (
      <p className="pl-1 text-xs font-medium text-rose-600">{errorText}</p>
    )}
  </div>
);
