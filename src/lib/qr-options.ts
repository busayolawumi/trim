// Shared by the download route (server) and the QR panel (browser) so both draw the same code.
// Always black on white: many scanners can't read light-on-dark codes.
export const QR_OPTIONS = {
  errorCorrectionLevel: "M",
  margin: 4, // the blank border scanners need, in modules
  color: { dark: "#000000", light: "#ffffff" },
} as const;
