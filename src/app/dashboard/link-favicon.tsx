"use client";

import { useState } from "react";

/**
 * The destination site's icon, from DuckDuckGo's favicon service (nothing stored, no referrer
 * sent). Shows the domain's first letter instead when the site has no icon or the request fails.
 */
export function LinkFavicon({ domain }: { domain: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      aria-hidden
      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-white text-sm font-semibold uppercase text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
    >
      {failed ? (
        domain[0]
      ) : (
        // A plain <img>: next/image would proxy every icon through our own functions.
        <img
          src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
          alt=""
          width={24}
          height={24}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          // The error can fire before React hydrates and listens for it, so check on mount too.
          ref={(img) => {
            if (img?.complete && img.naturalWidth === 0) setFailed(true);
          }}
          className="h-6 w-6"
        />
      )}
    </div>
  );
}
