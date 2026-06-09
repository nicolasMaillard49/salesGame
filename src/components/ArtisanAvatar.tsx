import Icon from "@/components/Icon";

// De vraies photos d'artisans (générées) pour donner un visage aux prospects.
const PHOTOS = [
  "/artisans/plombier.webp",
  "/artisans/couvreur.webp",
  "/artisans/paysagiste.webp",
] as const;

// Association métier → photo la plus cohérente ; sinon choix déterministe stable.
const KEYWORDS: { match: string[]; idx: number }[] = [
  { match: ["plomb", "chauffag", "serrur", "électric", "electric"], idx: 0 },
  { match: ["couvr", "toiture", "maçon", "macon", "façad", "facad", "carrel", "menuis"], idx: 1 },
  { match: ["paysag", "jardin", "peintre", "élagu", "elagu"], idx: 2 },
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
