// Sheet Color themes (v14): 12 cocktail palettes, agreed with the user on mockups (2026-09).
// Pure data: `colors` fills design.colors (10 roles), `background` is the sheet background gradient
// (its OWN stop count — never padded or interpolated), `cardEnd` (optional) is the card's gradient end
// when it differs from the MD frame's, `trayRimLight` is the tray's reflection rim light (v14 step 2). apply-theme.js writes all of it at edit time; the renderer
// never reads this file. Theme 12 "White Russian" was replaced by "Turqs & Cocos" (v14).

// The 10 Sheet Color roles, in panel order.
export const COLOR_ROLES = ["bg", "pattern", "gradient", "cardBase", "ink", "inkSoft", "accent", "accent2", "tray", "board"];

export const THEMES = [
  { id: "bramble", heart: "#B23A5B", name: "Bramble", nameKo: "브램블",
    trayRimLight: "#F3E4EB",
    colors: { bg: "#EBC6DC", pattern: "#E3B6CC", gradient: "#D3B8E6", cardBase: "#FDF8FA", ink: "#3B1732", inkSoft: "#C9A0BC", accent: "#C3304F", accent2: "#7E4DB0", tray: "#A98496", board: "#B994A6" },
    background: { direction: "topToBottom", stops: [{ pos: 0, color: "#F7D3DC" }, { pos: 0.5, color: "#EBC6DC" }, { pos: 1, color: "#D4BDEB" }] } },
  { id: "pinkLady", heart: "#E7A3B8", name: "Pink Lady", nameKo: "핑크 레이디",
    trayRimLight: "#FBEDEF",
    colors: { bg: "#FCE0E4", pattern: "#F4C6D2", gradient: "#F7BCCB", cardBase: "#FFF8E4", ink: "#4A2030", inkSoft: "#E6A9BA", accent: "#E85C87", accent2: "#F2D27A", tray: "#C29DA6", board: "#D3AFB8" },
    background: { direction: "topToBottom", stops: [{ pos: 0, color: "#FFF2D2" }, { pos: 0.5, color: "#FCE0E4" }, { pos: 1, color: "#F8C6D4" }] } },
  { id: "tequilaSunrise", heart: "#E0794A", name: "Tequila Sunrise", nameKo: "데킬라 선라이즈", cardEnd: "#F6AE9C",
    trayRimLight: "#FCEADF",
    colors: { bg: "#FFD9B8", pattern: "#F5C4A0", gradient: "#F8B7A4", cardBase: "#FFF8EE", ink: "#4A2418", inkSoft: "#E4A88E", accent: "#F07A2E", accent2: "#D8323F", tray: "#C08A76", board: "#D0AD9C" },
    background: { direction: "topToBottom", stops: [{ pos: 0, color: "#FFEDC6" }, { pos: 0.5, color: "#FFD9B8" }, { pos: 1, color: "#F9C0B2" }] } },
  { id: "cinderella", heart: "#E3B53C", name: "Cinderella", nameKo: "신데렐라", cardEnd: "#FDE6A4",
    trayRimLight: "#FBF1D6",
    colors: { bg: "#FFEFC0", pattern: "#F3D98E", gradient: "#FBDF96", cardBase: "#FFFBEE", ink: "#4A3A12", inkSoft: "#E0C98A", accent: "#F2B51E", accent2: "#F28C38", tray: "#C4AE78", board: "#D2C19A" },
    background: { direction: "topToBottom", stops: [{ pos: 0, color: "#FFF8DF" }, { pos: 0.5, color: "#FFEFC0" }, { pos: 1, color: "#FCE2A0" }] } },
  { id: "juneBug", heart: "#7DB36A", name: "June Bug", nameKo: "준 벅",
    trayRimLight: "#EAF3E4",
    colors: { bg: "#DDF0CC", pattern: "#C9E3B4", gradient: "#BDE3B4", cardBase: "#FAFDF3", ink: "#1E3A1E", inkSoft: "#A9CFA0", accent: "#4DB85A", accent2: "#A6D84A", tray: "#8FAE8A", board: "#AEC4A6" },
    background: { direction: "topToBottom", stops: [{ pos: 0, color: "#F2F9D8" }, { pos: 0.5, color: "#DDF0CC" }, { pos: 1, color: "#C6E6C0" }] } },
  { id: "donghae", heart: "#2F63B0", name: "동해", nameKo: "동해", cardEnd: "#B8D3F4",
    trayRimLight: "#E3ECF8",
    colors: { bg: "#C2DAF6", pattern: "#B0CCEE", gradient: "#9DC0EE", cardBase: "#F7FAFE", ink: "#14284A", inkSoft: "#9DB7DB", accent: "#1F6FD6", accent2: "#5FC7F0", tray: "#7F95B4", board: "#A2B2C8" },
    background: { direction: "topToBottom", stops: [{ pos: 0, color: "#E0EEFC" }, { pos: 0.5, color: "#C2DAF6" }, { pos: 1, color: "#A6C5EF" }] } },
  { id: "alexandersBigBrother", heart: "#8FC4DE", name: "Alexander\'s Big Brother", nameKo: "알렉산더스 빅 브라더", cardEnd: "#CDE8F6",
    trayRimLight: "#E6F1F6",
    colors: { bg: "#E6F3F6", pattern: "#C4E2F1", gradient: "#BFE2F4", cardBase: "#FFFBEF", ink: "#1B3A4A", inkSoft: "#A6CFE3", accent: "#4FB0E4", accent2: "#EFD49C", tray: "#8FAFBF", board: "#AFC5D0" },
    background: { direction: "topToBottom", stops: [{ pos: 0, color: "#D6EEFA" }, { pos: 0.55, color: "#E6F3F6" }, { pos: 1, color: "#FBF1DA" }] } },
  { id: "aviation", heart: "#8A6CC4", name: "Aviation", nameKo: "에비에이션", cardEnd: "#D3C3F2",
    trayRimLight: "#EDE7F6",
    colors: { bg: "#DED1F5", pattern: "#CDBDEE", gradient: "#C4B0EC", cardBase: "#FBF9FE", ink: "#2A1A48", inkSoft: "#B7A6DC", accent: "#7B4FD0", accent2: "#B89BEF", tray: "#9A8CB6", board: "#B4AAC8" },
    background: { direction: "topToBottom", stops: [{ pos: 0, color: "#F0E9FB" }, { pos: 0.5, color: "#DED1F5" }, { pos: 1, color: "#CAB7EE" }] } },
  { id: "espressoMartini", heart: "#7A5140", name: "Espresso Martini", nameKo: "에스프레소 마티니", cardEnd: "#E2CCB0",
    trayRimLight: "#F1E7DC",
    colors: { bg: "#E8D5BF", pattern: "#DCC3A6", gradient: "#D4B494", cardBase: "#FCF8F1", ink: "#3A2418", inkSoft: "#C9AE92", accent: "#8A5A3C", accent2: "#D9B488", tray: "#9C8069", board: "#B8A28F" },
    background: { direction: "topToBottom", stops: [{ pos: 0, color: "#F7EDDF" }, { pos: 0.5, color: "#E8D5BF" }, { pos: 1, color: "#D2B597" }] } },
  { id: "blackVelvet", heart: "#2B2630", name: "Black Velvet", nameKo: "블랙 벨벳", cardEnd: "#B9ABCB",
    trayRimLight: "#E4DCEC",
    colors: { bg: "#1E1924", pattern: "#2A2332", gradient: "#9A8BAE", cardBase: "#FBF6EA", ink: "#17141B", inkSoft: "#8C7FA0", accent: "#D2AE5C", accent2: "#EAD8A4", tray: "#5A5066", board: "#6F6480" },
    background: { direction: "topToBottom", stops: [{ pos: 0, color: "#CDB985" }, { pos: 0.07, color: "#A08E7C" }, { pos: 0.18, color: "#625471" }, { pos: 0.42, color: "#2A2332" }, { pos: 0.75, color: "#17141B" }, { pos: 1, color: "#131116" }] } },
  { id: "silverFizz", heart: "#A7ADB5", name: "Silver Fizz", nameKo: "실버 피즈", cardEnd: "#DCE0E5",
    trayRimLight: "#EEF0F2",
    colors: { bg: "#E4E7EB", pattern: "#D2D7DD", gradient: "#C9CFD6", cardBase: "#FBFCFD", ink: "#252A31", inkSoft: "#B3BAC3", accent: "#7F8C9E", accent2: "#E3C766", tray: "#9199A3", board: "#B3B9C0" },
    background: { direction: "topToBottom", stops: [{ pos: 0, color: "#F6F7F9" }, { pos: 0.5, color: "#E4E7EB" }, { pos: 1, color: "#CED3DA" }] } },
  { id: "turqsCocos", heart: "#F4FBFA", name: "Turqs & Cocos", nameKo: "터크스 앤 코코스", cardEnd: "#D9F1EC",
    trayRimLight: "#FFFFFF",
    colors: { bg: "#F7FCFB", pattern: "#E1F1EE", gradient: "#E3F5F2", cardBase: "#FFFFFF", ink: "#1E3B3A", inkSoft: "#BCDFD9", accent: "#1FB5AC", accent2: "#7FDCC0", tray: "#9DBFBB", board: "#C9DCD9" },
    background: { direction: "topToBottom", stops: [{ pos: 0, color: "#FFFFFF" }, { pos: 0.55, color: "#F7FCFB" }, { pos: 1, color: "#DDF3EF" }] } },
];

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) ?? null;
}
