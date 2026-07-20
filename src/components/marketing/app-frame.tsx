import Image from 'next/image';

/**
 * A real product screenshot in a minimal browser frame — hairline chrome,
 * three dots, mono URL. The screenshots in /public/screens are captured from
 * the actual app at 2x; the imagery IS the software.
 */
export function AppFrame({
  src,
  alt,
  url,
  caption,
  priority = false,
}: {
  src: string;
  alt: string;
  url: string;
  caption?: string;
  priority?: boolean;
}) {
  return (
    <figure>
      <div className="overflow-hidden rounded-cards bg-paper shadow-artifact">
        <div className="flex items-center gap-3 border-b border-hairline bg-ledger px-4 py-2.5">
          <span aria-hidden className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border border-iron" />
            <span className="h-2.5 w-2.5 rounded-full border border-iron" />
            <span className="h-2.5 w-2.5 rounded-full border border-iron" />
          </span>
          <span className="tnum truncate text-caption text-slate">{url}</span>
        </div>
        <Image src={src} alt={alt} width={2560} height={1640} priority={priority} className="block w-full" />
      </div>
      {caption ? <figcaption className="mt-3 text-caption text-ash">{caption}</figcaption> : null}
    </figure>
  );
}
