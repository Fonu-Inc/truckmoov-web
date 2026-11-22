import type { Reach } from "./audience";
import {
  describe, expect, it,
} from "vitest";
import {
  EMPTY_DRAFT, stepProblem, toInput,
} from "./builderState";

const reach: Reach = {
  recipients: [
    {
      audience_ref: "t1", channel: "sms", destination: "2348012345678",
    },
  ],
  reachable: {
    whatsapp: 0, sms: 1, email: 0,
  },
  missing: {
    whatsapp: 0, sms: 0, email: 0,
  },
};
const none: Reach = {
  recipients: [], reachable: {
    whatsapp: 0, sms: 0, email: 0,
  }, missing: {
    whatsapp: 0, sms: 1, email: 0,
  },
};

describe(
  "stepProblem",
  () => {
    it(
      "asks for a name and a channel first",
      () => {
        expect(stepProblem(
          0,
          EMPTY_DRAFT,
          none,
        )).toContain("name");
        expect(stepProblem(
          0,
          {
            ...EMPTY_DRAFT, name: "x",
          },
          none,
        )).toContain("channel");
        expect(stepProblem(
          0,
          {
            ...EMPTY_DRAFT, name: "x", channels: ["sms"],
          },
          none,
        )).toBeNull();
      },
    );

    it(
      "needs a body for every channel and a template for WhatsApp",
      () => {
        const base = {
          ...EMPTY_DRAFT, name: "x",
        };
        expect(stepProblem(
          1,
          {
            ...base, channels: ["whatsapp"],
          },
          none,
        )).toContain("template");
        expect(stepProblem(
          1,
          {
            ...base, channels: ["sms"],
          },
          none,
        )).toContain("SMS");
        expect(stepProblem(
          1,
          {
            ...base, channels: ["email"],
          },
          none,
        )).toContain("email");
        expect(stepProblem(
          1,
          {
            ...base, channels: ["sms"], smsBody: "hi",
          },
          none,
        )).toBeNull();
        expect(stepProblem(
          1,
          {
            ...base, channels: ["sms"], smsBody: "Hi {{name}}",
          },
          none,
        )).toContain("Replace");
      },
    );

    it(
      "needs an audience somebody can actually reach",
      () => {
        const draft = {
          ...EMPTY_DRAFT, channels: ["sms" as const],
        };
        expect(stepProblem(
          2,
          draft,
          none,
        )).toContain("Choose who");
        expect(stepProblem(
          2,
          {
            ...draft, audienceIds: ["t1"],
          },
          none,
        )).toContain("address");
        expect(stepProblem(
          2,
          {
            ...draft, audienceIds: ["t1"],
          },
          reach,
        )).toBeNull();
      },
    );

    it(
      "needs a time when scheduling",
      () => {
        expect(stepProblem(
          3,
          {
            ...EMPTY_DRAFT, sendLater: true,
          },
          reach,
        )).toContain("when");
        expect(stepProblem(
          3,
          {
            ...EMPTY_DRAFT, sendLater: true, sendAt: "2026-10-10T10:00",
          },
          reach,
        )).toBeNull();
      },
    );
  },
);

describe(
  "toInput",
  () => {
    it(
      "only carries what the channels use",
      () => {
        const input = toInput(
          {
            ...EMPTY_DRAFT, name: " Notice ", channels: ["sms"], smsBody: " hi ", emailBody: "ignored", templateName: "ignored",
          },
          reach,
        );
        expect(input).toMatchObject({
          name: "Notice", channels: ["sms"], bodies: { sms: "hi" }, template_name: undefined, scheduled_for: undefined,
        });
        expect(input.bodies.email).toBeUndefined();
        expect(input.recipients).toHaveLength(1);
      },
    );

    it(
      "sends the template name and an ISO schedule",
      () => {
        const input = toInput(
          {
            ...EMPTY_DRAFT, name: "n", channels: ["whatsapp"], templateName: "announce", sendLater: true, sendAt: "2026-10-10T10:00",
          },
          reach,
        );
        expect(input.template_name).toBe("announce");
        expect(input.scheduled_for).toMatch(/Z$/);
      },
    );
  },
);
