export interface LinkUsageOption {
  value: string;
  label: string;
}

export const LINK_USAGE_OPTIONS: LinkUsageOption[] = [
  {
    value: "Bai viet Facebook",
    label: "Bài viết Facebook",
  },
  { value: "Reel Facebook", label: "Reel Facebook" },
  { value: "Bio TikTok", label: "Bio TikTok" },
  { value: "Video TikTok", label: "Video TikTok" },
  { value: "Zalo OA", label: "Zalo OA" },
  { value: "Nhom seeding", label: "Nhóm seeding" },
  { value: "Livestream", label: "Livestream" },
];

export const LINK_USAGE_DEFAULT = LINK_USAGE_OPTIONS[0].value;

export const LINK_USAGE_OPTIONS_WITH_PLACEHOLDER: LinkUsageOption[] = [
  {
    value: "",
    label: "Chọn vị trí sử dụng (tùy chọn)",
  },
  ...LINK_USAGE_OPTIONS,
];

const normalizeUsageKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\s+/g, " ");

export const normalizeUsageContext = (value?: string | null) => {
  if (!value) return "";

  const trimmedValue = value.trim();
  const directMatch = LINK_USAGE_OPTIONS.find(
    (option) => option.value === trimmedValue,
  );

  if (directMatch) {
    return directMatch.value;
  }

  const normalizedValue = normalizeUsageKey(trimmedValue);
  const normalizedMatch = LINK_USAGE_OPTIONS.find(
    (option) =>
      normalizeUsageKey(option.value) === normalizedValue ||
      normalizeUsageKey(option.label) === normalizedValue,
  );

  return normalizedMatch?.value ?? trimmedValue;
};
