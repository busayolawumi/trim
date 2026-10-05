import Image from "next/image";
import { DownloadIcon, QrCodeIcon, XIcon } from "@/components/icons";
import { ghostIconButtonClass, iconButtonClass, modalClass, secondaryButtonClass } from "@/components/ui";
import { SHORT_HOST } from "@/lib/config";

/**
 * Button that opens a link's QR code with PNG and SVG downloads. Uses the browser's
 * popover attribute (closes on Escape or a click outside), so it needs no client JavaScript.
 * The code is a lazy image, so a list of links only fetches the ones that are opened.
 */
export function QrCodeButton({ slug }: { slug: string }) {
  const id = `qr-${slug}`;

  return (
    <>
      <button
        type="button"
        popoverTarget={id}
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
        {/* White square while it loads; lazy images in a closed popover aren't fetched. */}
        <div className="mt-3 aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800">
          <Image
            src={`/dashboard/${slug}/qr?format=svg`}
            alt={`QR code for ${SHORT_HOST}/${slug}`}
            width={256}
            height={256}
            unoptimized
            className="block h-auto w-full"
          />
        </div>
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
