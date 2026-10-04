import { DownloadIcon, QrCodeIcon, XIcon } from "@/components/icons";
import { cardClass, ghostIconButtonClass, iconButtonClass, secondaryButtonClass } from "@/components/ui";
import { SHORT_HOST } from "@/lib/config";
import { qrSvg } from "@/lib/qr";

const POPOVER_ID = "qr-code";

/**
 * Button that opens a link's QR code with PNG and SVG downloads. Uses the browser's
 * popover attribute (closes on Escape or a click outside), so it needs no client JavaScript.
 */
export async function QrCodeButton({ slug }: { slug: string }) {
  const svg = await qrSvg(slug);

  return (
    <>
      <button
        type="button"
        popoverTarget={POPOVER_ID}
        aria-label="Show QR code"
        title="QR code"
        className={iconButtonClass}
      >
        <QrCodeIcon />
      </button>
      {/* No display class here: it would override the browser hiding the closed popover. */}
      <div
        id={POPOVER_ID}
        popover="auto"
        role="dialog"
        aria-labelledby={`${POPOVER_ID}-title`}
        className={`${cardClass} m-auto w-72 max-w-[calc(100vw-2rem)] text-foreground backdrop:bg-black/40`}
      >
        <div className="flex items-center justify-between">
          <h2 id={`${POPOVER_ID}-title`} className="font-semibold">
            QR code
          </h2>
          <button
            type="button"
            popoverTarget={POPOVER_ID}
            popoverTargetAction="hide"
            aria-label="Close"
            title="Close"
            className={ghostIconButtonClass}
          >
            <XIcon />
          </button>
        </div>
        {/* Made by the qrcode library from our own short URL, so it's safe to inline. */}
        <div
          role="img"
          aria-label={`QR code for ${SHORT_HOST}/${slug}`}
          className="mt-3 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
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
