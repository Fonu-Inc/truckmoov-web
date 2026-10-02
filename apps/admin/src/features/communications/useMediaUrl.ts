import { useQuery } from "@tanstack/react-query";
import { fetchMessagingMedia } from "@truckmoov/api/notification";
import { useEffect, useState } from "react";

/**
 * Media sits behind the bearer token, so a plain src cannot load it. The file
 * is fetched with the app's session and shown from a local object URL.
 */
export function useMediaUrl(path: string | undefined, enabled = true) {
  const query = useQuery({
    queryKey: ["platform-messaging", "media", path],
    queryFn: () => fetchMessagingMedia(path as string),
    enabled: enabled && Boolean(path),
    staleTime: Infinity,
    gcTime: 10 * 60_000,
    retry: false,
  });
  const [url, setUrl] = useState<string | null>(null);

  useEffect(
    () => {
      if (!query.data) {
        setUrl(null);
        return;
      }
      const objectUrl = URL.createObjectURL(query.data);
      setUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    },
    [query.data],
  );

  return { url, isLoading: query.isLoading, isError: query.isError, refetch: query.refetch };
}
