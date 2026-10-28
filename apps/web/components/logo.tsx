import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="logo" aria-label="HBBA — на главную">
      <span className="logo-mark" aria-hidden="true">
        <span />
        <span />
      </span>
      {!compact && (
        <span className="logo-copy">
          <strong>HBBA</strong>
          <small>Health navigator</small>
        </span>
      )}
    </Link>
  );
}
