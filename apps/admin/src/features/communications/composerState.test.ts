import {
  describe, expect, it,
} from "vitest";
import {
  attachmentProblem, composerDisabledReason, noteDisabledReason, restSendDisabledReason,
} from "./composerState";

describe(
  "composerDisabledReason",
  () => {
    const open = { is_locked: false };
    it(
      "explains each blocked state in order",
      () => {
        expect(composerDisabledReason(
          open,
          false,
          "connected",
        )).toBe("You can read messages but not reply.");
        expect(composerDisabledReason(
          { is_locked: true },
          true,
          "connected",
        )).toContain("24-hour window");
        expect(composerDisabledReason(
          open,
          true,
          "offline",
        )).toContain("connection");
        expect(composerDisabledReason(
          open,
          true,
          "connected",
        )).toBeNull();
      },
    );
  },
);

describe(
  "restSendDisabledReason",
  () => {
    it(
      "needs permission and an open window",
      () => {
        expect(restSendDisabledReason(
          false,
          true,
        )).toBeNull();
        expect(restSendDisabledReason(
          true,
          true,
        )).toContain("24-hour window");
        expect(restSendDisabledReason(
          false,
          false,
        )).toBe("You can read messages but not reply.");
      },
    );

    it(
      "lets staff with permission write notes even when the window is closed",
      () => {
        expect(noteDisabledReason(true)).toBeNull();
        expect(noteDisabledReason(false)).not.toBeNull();
      },
    );
  },
);

describe(
  "attachmentProblem",
  () => {
    const file = (type: string, size: number) => new File(
      [new Uint8Array(size)],
      "f",
      { type },
    );

    it(
      "accepts what WhatsApp takes and names what it does not",
      () => {
        expect(attachmentProblem(file(
          "image/png",
          1024,
        ))).toBeNull();
        expect(attachmentProblem(file(
          "application/x-msdownload",
          10,
        ))).toContain("cannot send");
        expect(attachmentProblem(file(
          "image/jpeg",
          6 * 1024 * 1024,
        ))).toContain("5 MB");
        expect(attachmentProblem(file(
          "video/mp4",
          17 * 1024 * 1024,
        ))).toContain("16 MB");
      },
    );
  },
);
