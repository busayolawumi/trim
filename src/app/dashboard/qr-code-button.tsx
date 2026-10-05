"use client";

import { useRef, useState } from "react";
import { DownloadIcon, QrCodeIcon, XIcon } from "@/components/icons";
import { ghostIconButtonClass, iconButtonClass, modalClass, secondaryButtonClass } from "@/components/ui";
import { SHORT_HOST, shortUrl } from "@/lib/config";
import { QR_OPTIONS } from "@/lib/qr-options";

/**
 * Button that opens a link's QR code with PNG and SVG downloads. The panel uses the browser's
 * popover attribute (closes on Escape or a click outside).
 */
export function QrCodeButton({ slug }: { slug: string }) {
  const id = `qr-${slug}`;
  const [svg, setSvg] = useState<string | null>(null);
  const started = useRef(false);

  // Drawn in the browser as soon as the button is hovered, focused or clicked, so the panel opens
  // with the code already there: no request, no database. The library is downloaded then, not
  // with the page, so a long list of links costs nothing until a code is wanted.
  function prepare() {
    if (started.current) return;
    started.current = true;
    import("qrcode")
      .then(({ default: QRCode }) => QRCode.toString(shortUrl(slug), { ...QR_OPTIONS, type: "svg" }))
      .then(setSvg)
      .catch(() => {
        started.current = false; // e.g. offline; try again next time
      });
  }

  return (
    <>
      <button
        type="button"
        popoverTarget={id}
        onPointerEnter={prepare}
        onFocus={prepare}
        onClick={prepare}
        aria-label={`Show QR code for /${slug}`}
        title="QR code"
        className={iconButtonClass}
      >
        <QrCodeIcon />
      </button>
      <div id={id} popover="auto" role="dialog" aria-labelledby={`${id}-title`} className={modalClass}>
        <div className="flex items-center justify-between">
          <h2 id={`${id}-title`} className="font-semibold">
            QR code
          </h2>
          <button
            type="button"
            popoverTarget={id}
            popoverTargetAction="hide"
            aria-label="Close"
            title="Close"
            className={ghostIconButtonClass}
          >
            <XIcon />
          </button>
        </div>
        {/* White square until it's drawn. The SVG comes from the qrcode library and our own URL. */}
        <div
          role="img"
          aria-label={`QR code for ${SHORT_HOST}/${slug}`}
          className="mt-3 aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
          dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
        />
        <p className="mt-2 truncate text-center font-mono text-sm">
          {SHORT_HOST}/{slug}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <a href={`/dashboard/${slug}/qr`} download className={`${secondaryButtonClass} gap-2`}>
            <DownloadIcon size={16} /> PNG
          </a>
          <a href={`/dashboard/${slug}/qr?format=svg`} download className={`${secondaryButtonClass} gap-2`}>
            <DownloadIcon size={16} /> SVG
          </a>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Scans count as clicks. You can change the destination without reprinting, but renaming
          the link breaks this code.
        </p>
      </div>
    </>
  );
}
