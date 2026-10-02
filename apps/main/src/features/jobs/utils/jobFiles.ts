export function formatFileSize(bytes?: number) {
  if (!bytes)
    return "";
  return bytes < 1024 * 1024 ? `${Math.max(
    1,
    Math.round(bytes / 1024),
  )} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Hands a file the API returned as base64 to the browser as a download. */
export function saveBase64File(name: string, contentType: string | undefined, base64: string) {
  const bytes = Uint8Array.from(
    atob(base64),
    char => char.charCodeAt(0),
  );
  const url = URL.createObjectURL(new Blob(
    [bytes],
    { type: contentType || "application/octet-stream" },
  ));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
