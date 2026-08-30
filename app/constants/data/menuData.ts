export type MenuItem = {
  text: string;
  href: string;
  icon: string;
  customClass?: string;
  activePrefixes?: string[];
  desc?: string;
  disabled?: boolean;
};

export type MenuSection = {
  id: string;
  heading?: string;
  globalNavHeading?: string;
  icon?: string;
  accent?: "tool" | "database" | "reference" | "management" | "main";
  items: MenuItem[];
  showInDashboard: boolean;
};

export const menuData: MenuSection[] = [
  {
    id: "home",
    items: [{ text: "ホーム", href: "/", icon: "home" }],
    showInDashboard: false,
  },
  {
    id: "management",
    heading: "現場管理",
    globalNavHeading: "現場管理",
    icon: "users",
    accent: "management",
    items: [
      {
        text: "現場ポータル",
        href: "/portal",
        icon: "users",
        customClass: "l-global-nav__link--management",
        activePrefixes: ["/login", "/select-site", "/no-site", "/portal"],
        desc: "各現場へログインし共有情報にアクセスします。",
      },
      {
        text: "ポータル管理（開発者のみ）",
        href: "/portal/admin",
        icon: "terminal",
        customClass: "l-global-nav__link--management",
        desc: "システム全体の設定を行う管理者用コンソールです。",
      },
    ],
    showInDashboard: true,
  },
  {
    id: "tools",
    heading: "計算ツール",
    globalNavHeading: "計算ツール",
    icon: "hash",
    accent: "tool",
    items: [
      {
        text: "電圧降下計算・ケーブルサイズ選定",
        href: "/tools/voltage",
        icon: "zap",
        customClass: "l-global-nav__link--tool",
        desc: "適切なケーブルサイズと電圧降下を自動計算します。",
      },
      {
        text: "配管サイズ自動選定",
        href: "/tools/conduit",
        icon: "target",
        customClass: "l-global-nav__link--tool",
        desc: "内線規程に基づき適切な配管サイズを導き出します。",
      },
      {
        text: "ケーブルラック選定",
        href: "/tools/rack",
        icon: "align-justify",
        customClass: "l-global-nav__link--tool",
        desc: "最適なラック幅を自動選定します。",
      },
      {
        text: "ケーブル重量概算・ドラム選定",
        href: "/tools/weight",
        icon: "package",
        customClass: "l-global-nav__link--tool",
        desc: "ケーブル重量を概算し最適な木製ドラムを提案します。",
      },
      {
        text: "計算履歴",
        href: "/tools/history",
        icon: "clipboard",
        customClass: "l-global-nav__link--tool",
        desc: "各計算ツールの履歴一覧を確認・管理できます。",
      }
    ],
    showInDashboard: true,
  },
  {
    id: "database",
    heading: "規格データベース",
    globalNavHeading: "規格",
    icon: "database",
    accent: "database",
    items: [
      {
        text: "ケーブル規格",
        href: "/database/cable-db",
        icon: "book",
        customClass: "l-global-nav__link--database",
        desc: "各種ケーブルの外径や許容電流値を参照できます。",
      },
      {
        text: "配管規格",
        href: "/database/conduit-db",
        icon: "target",
        customClass: "l-global-nav__link--database",
        desc: "各種配管の寸法や付属品の適合サイズを確認できます。",
      },
      {
        text: "ケーブルラック規格",
        href: "/database/rack-db",
        icon: "align-justify",
        customClass: "l-global-nav__link--database",
        desc: "ケーブルラックの標準的なデータを参照できます。",
      },
      {
        text: "ケーブルドラム規格",
        href: "/database/drum-db",
        icon: "disc",
        customClass: "l-global-nav__link--database",
        desc: "木製ドラムの各種寸法データを参照できます。",
      },
      {
        text: "締付トルク一覧表",
        href: "/database/torque-db",
        icon: "tool",
        customClass: "l-global-nav__link--database",
        desc: "各種ボルトや端子の締付トルク値を参照できます。",
      },
    ],
    showInDashboard: true,
  },
  {
    id: "reference",
    heading: "学習・リファレンス",
    globalNavHeading: "学習・リファレンス",
    icon: "book",
    accent: "reference",
    items: [
      {
        text: "用語解説",
        href: "/reference/glossary",
        icon: "book-open",
        customClass: "l-global-nav__link--reference",
        desc: "建築・設備関連の用語をまとめたクイック辞書です。",
      }
    ],
    showInDashboard: true,
  },
  {
    id: "settings",
    heading: "設定",
    globalNavHeading: "設定",
    icon: "settings",
    accent: "management",
    items: [
      {
        text: "UI・個人設定",
        href: "/settings",
        icon: "settings",
        customClass: "l-global-nav__link--management",
        activePrefixes: ["/settings"],
        desc: "背景やマウス軌跡などのUI設定をカスタマイズします。",
      },
    ],
    showInDashboard: true,
  },
];
