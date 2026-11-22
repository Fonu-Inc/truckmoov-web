import type { MessagingMedia } from "@truckmoov/api/notification";
import {
  Download, FileText, ImageOff, Loader2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/shadcn/dialog";
import { useMediaUrl } from "../useMediaUrl";

function Unavailable() {
  return (
    <p className="flex items-center gap-2 text-xs italic opacity-80">
      <ImageOff className="h-4 w-4" />
      This file is no longer available.
    </p>
  );
}

function Loading() {
  return (
    <div className="flex h-24 w-40 items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin opacity-60" />
    </div>
  );
}

function ImageMedia({ media }: { media: MessagingMedia }) {
  const {
    url, isLoading, isError,
  } = useMediaUrl(media.url);
  const [
    open,
    setOpen,
  ] = useState(false);
  if (isLoading)
    return <Loading />;
  if (isError || !url)
    return <Unavailable />;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open image"
      >
        <img
          src={url}
          alt={media.caption ?? "Image"}
          className="max-h-64 max-w-full rounded-md object-cover"
        />
      </button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogContent className="max-w-3xl">
          <DialogTitle className="sr-only">Image</DialogTitle>
          <img
            src={url}
            alt={media.caption ?? "Image"}
            className="max-h-[75vh] w-full object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function PlayableMedia({ media }: { media: MessagingMedia }) {
  const {
    url, isLoading, isError,
  } = useMediaUrl(media.url);
  if (isLoading)
    return <Loading />;
  if (isError || !url)
    return <Unavailable />;
  return media.type === "video"
    ? (
        <video
          src={url}
          controls
          className="max-h-64 max-w-full rounded-md"
        >
          <track kind="captions" />
        </video>
      )
    : (
        <audio
          src={url}
          controls
          className="max-w-full"
        />
      );
}

function DocumentMedia({ media }: { media: MessagingMedia }) {
  const [
    wanted,
    setWanted,
  ] = useState(false);
  const {
    url, isLoading, isError,
  } = useMediaUrl(
    media.url,
    wanted,
  );
  const name = media.filename || "Document";

  return (
    <div className="flex items-center gap-3">
      <FileText className="h-8 w-8 shrink-0 opacity-80" />
      <p className="min-w-0 flex-1 truncate text-sm">{name}</p>
      {url
        ? (
            <Button
              asChild
              size="icon-sm"
              variant="secondary"
            >
              <a
                href={url}
                download={name}
                aria-label={`Download ${name}`}
              >
                <Download className="h-4 w-4" />
              </a>
            </Button>
          )
        : (
            <Button
              size="icon-sm"
              variant="secondary"
              aria-label={`Load ${name}`}
              loading={wanted && isLoading}
              onClick={() => setWanted(true)}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
      {wanted && isError && <p className="text-xs text-destructive">Could not load.</p>}
    </div>
  );
}

export function MediaContent({ media }: { media: MessagingMedia }) {
  if (!media.url)
    return <Unavailable />;
  if (media.type === "image")
    return <ImageMedia media={media} />;
  if (media.type === "document")
    return <DocumentMedia media={media} />;
  return <PlayableMedia media={media} />;
}
