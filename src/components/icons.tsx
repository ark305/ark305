// Íconos del diseño, dibujados a mano (trazo redondeado).
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number; stroke?: string; weight?: number };

function Icon({ size = 24, stroke = "currentColor", weight = 1.7, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconCopy = (p: IconProps) => (
  <Icon {...p}>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </Icon>
);
export const IconPen = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16z" />
  </Icon>
);
export const IconMenu = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);
export const IconPlus = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const IconCheck = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);
export const IconChevron = (p: IconProps) => (
  <Icon {...p}>
    <path d="m9 6 6 6-6 6" />
  </Icon>
);
export const IconArrow = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);
export const IconSearch = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </Icon>
);
export const IconDollar = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15 9.2c-.5-.9-1.6-1.4-3-1.4-1.8 0-3 .9-3 2.1 0 2.9 6 1.4 6 4.3 0 1.3-1.3 2.1-3 2.1-1.5 0-2.6-.6-3.1-1.6M12 6v1.8M12 16.3V18" />
  </Icon>
);
export const IconInstagram = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" />
  </Icon>
);
export const IconTikTok = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
    <path d="M14 3c.4 2.6 2.2 4.3 5 4.5" />
  </Icon>
);
export const IconFacebook = (p: IconProps) => (
  <Icon {...p}>
    <path d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H6v3h2v8h3v-8h2.5l.5-3H11V7.5A1.5 1.5 0 0 1 12.5 6H15z" />
  </Icon>
);
export const IconSparkle = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3l1.8 4.6L18 9.5l-4.2 1.9L12 16l-1.8-4.6L6 9.5l4.2-1.9z" />
    <path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
  </Icon>
);
export const IconMegaphone = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
  </Icon>
);
export const IconChatSpark = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 5h16v11H9l-5 4z" />
    <path d="M12 8l.9 2.1L15 11l-2.1.9L12 14l-.9-2.1L9 11l2.1-.9z" />
  </Icon>
);
export const IconBag = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16l-1.5 12h-13z" />
    <path d="M9 7V5a3 3 0 0 1 6 0v2" />
  </Icon>
);
export const IconPeople = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="8" cy="9" r="3" />
    <circle cx="16" cy="9" r="3" />
    <path d="M3 19a5 5 0 0 1 10 0M11 19a5 5 0 0 1 10 0" />
  </Icon>
);
export const IconDownload = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 4v11M7 10l5 5 5-5" />
    <path d="M4 19h16" />
  </Icon>
);
export const IconLock = (p: IconProps) => (
  <Icon {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Icon>
);
export const IconWallet = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M16 12h2" />
    <path d="M3 10h18" />
  </Icon>
);
export const IconMail = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Icon>
);
export const IconImage = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <circle cx="9" cy="10" r="2" />
    <path d="m21 16-5-5-9 9" />
  </Icon>
);
export const IconClose = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);
export const IconCalendar = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="3" />
    <path d="M8 3v4M16 3v4M3.5 10h17" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
  </Icon>
);
export const IconSun = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
  </Icon>
);
export const IconScooter = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="6" cy="17" r="2.5" />
    <circle cx="18" cy="17" r="2.5" />
    <path d="M8.5 17h7M15 6h2.5l2 8.5M15 6l-3 8.5M4 11h6" />
  </Icon>
);
export const IconTicket = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 6h16a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4V7a1 1 0 0 1 1-1z" />
    <path d="M14 5v2M14 11v2M14 17v2" />
  </Icon>
);
export const IconCrown = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 7l4.5 4L12 5l4.5 6L21 7l-2 11H5z" />
  </Icon>
);
export const IconCap = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2 9.5 12 5l10 4.5L12 14z" />
    <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9.5V15" />
  </Icon>
);
export const IconChart = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Icon>
);
export const IconHeart = (p: IconProps & { filled?: boolean }) => {
  const { filled, ...rest } = p;
  return (
    <Icon {...rest} fill={filled ? rest.stroke : "none"}>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    </Icon>
  );
};
export const IconComment = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z" />
  </Icon>
);
export const IconShare = (p: IconProps) => (
  <Icon {...p}>
    <path d="M21 4 10 14M21 4l-7 17-4-7-7-4z" />
  </Icon>
);
export const IconPlay = (p: IconProps) => (
  <Icon {...p} fill={p.stroke}>
    <path d="M8 5v14l11-7z" />
  </Icon>
);
export const IconBookmark = (p: IconProps & { filled?: boolean }) => {
  const { filled, ...rest } = p;
  return (
    <Icon {...rest} fill={filled ? "currentColor" : "none"}>
      <path d="M6 3h12v18l-6-4.5L6 21z" />
    </Icon>
  );
};
export const IconDots = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="5" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
  </Icon>
);
export const IconCar = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 16V11l2-5h10l2 5v5M3 16h18v3H3zM5 11h14" />
    <circle cx="7.5" cy="16" r="0.6" />
    <circle cx="16.5" cy="16" r="0.6" />
  </Icon>
);
export const IconBoat = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3v10M12 4l6 8H12M3 15h18l-2 4H5z" />
  </Icon>
);
export const IconChef = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 14a4 4 0 1 1 1.5-7.7A4 4 0 0 1 16 5.5a3.5 3.5 0 1 1 1 8.5V20H7z" />
    <path d="M7 17h10" />
  </Icon>
);
export const IconHome = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 11 12 4l9 7M5 10v10h14V10M10 20v-6h4v6" />
  </Icon>
);
export const IconCamera = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </Icon>
);
export const IconWrench = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14.5 5.5a4 4 0 0 0 5 5L12 18a2.1 2.1 0 1 1-3-3l7.5-7.5a4 4 0 0 1-2-2z" />
  </Icon>
);
export const IconMonitor = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8M12 16v4" />
  </Icon>
);
export const IconHeadset = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
    <rect x="3" y="14" width="4" height="6" rx="1.5" />
    <rect x="17" y="14" width="4" height="6" rx="1.5" />
  </Icon>
);
export const IconBriefcase = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5h6v2M3 12h18" />
  </Icon>
);
export const IconCode = (p: IconProps) => (
  <Icon {...p}>
    <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" />
  </Icon>
);
export const IconMic = (p: IconProps) => (
  <Icon {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </Icon>
);
