import Icon from "@/components/Icon";

// De vraies photos d'artisans (générées) pour donner un visage aux prospects.
const PHOTOS = [
  "/artisans/plombier.webp", // 0
  "/artisans/couvreur.webp", // 1
  "/artisans/paysagiste.webp", // 2
  "/artisans/electricien.webp", // 3
  "/artisans/macon.webp", // 4
  "/artisans/serrurier.webp", // 5
  "/artisans/peintre.webp", // 6
] as const;

// Association métier → photo la plus cohérente ; sinon choix déterministe stable.
const KEYWORDS: { match: string[]; idx: number }[] = [
  { match: ["plomb", "chauffag"], idx: 0 },
  { match: ["couvr", "toiture", "menuis"], idx: 1 },
  { match: ["paysag", "jardin", "élagu", "elagu"], idx: 2 },
  { match: ["électric", "electric"], idx: 3 },
  { match: ["maçon", "macon", "façad", "facad", "carrel"], idx: 4 },
  { match: ["serrur"], idx: 5 },
  { match: ["peintre"], idx: 6 },
];

function photoFor(metier: string): string {
  const m = metier.trim().toLowerCase();
  for (const k of KEYWORDS) if (k.match.some((w) => m.includes(w))) return PHOTOS[k.idx];
  // fallback déterministe : même métier → même visage
  let h = 0;
  for (let i = 0; i < m.length; i++) h = (h * 31 + m.charCodeAt(i)) >>> 0;
  return PHOTOS[h % PHOTOS.length];
}

export default function ArtisanAvatar({
  metier,
  size = 30,
  className = "",
}: {
  metier?: string | null;
  size?: number;
  className?: string;
}) {
  if (!metier) {
    return (
      <span className={`grid place-items-center ${className}`} style={{ width: size, height: size }}>
        <Icon name="worker" size={Math.round(size * 0.55)} />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photoFor(metier)}
      alt=""
      width={size}
      height={size}
      className={`object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
