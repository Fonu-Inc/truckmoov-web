import {
  describe, expect, it,
} from "vitest";
import {
  applyFormat, expandSlash, insertAt, slashQuery,
} from "./formatting";

describe(
  "applyFormat",
  () => {
    it(
      "wraps the selection and keeps it selected",
      () => {
        const edit = applyFormat(
          "hello world",
          6,
          11,
          "bold",
        );
        expect(edit.text).toBe("hello *world*");
        expect(edit.text.slice(
          edit.selectionStart,
          edit.selectionEnd,
        )).toBe("world");
      },
    );

    it(
      "unwraps a selection that is already wrapped",
      () => {
        expect(applyFormat(
          "*hi*",
          0,
          4,
          "bold",
        ).text).toBe("hi");
      },
    );

    it(
      "puts the caret between the marks when nothing is selected",
      () => {
        const edit = applyFormat(
          "ab",
          1,
          1,
          "italic",
        );
        expect(edit.text).toBe("a__b");
        expect(edit.selectionStart).toBe(2);
      },
    );
  },
);

describe(
  "insertAt",
  () => {
    it(
      "replaces the selection and moves the caret after it",
      () => {
        const edit = insertAt(
          "abc",
          1,
          2,
          "XY",
        );
        expect(edit.text).toBe("aXYc");
        expect(edit.selectionStart).toBe(3);
      },
    );
  },
);

describe(
  "slash replies",
  () => {
    it(
      "reads the shortcut being typed",
      () => {
        expect(slashQuery(
          "hi /et",
          6,
        )).toBe("et");
        expect(slashQuery(
          "/",
          1,
        )).toBe("");
        expect(slashQuery(
          "a/b",
          3,
        )).toBeNull();
        expect(slashQuery(
          "no slash",
          8,
        )).toBeNull();
      },
    );

    it(
      "swaps the shortcut for the reply body",
      () => {
        const edit = expandSlash(
          "hi /eta",
          7,
          "We are on the way.",
        );
        expect(edit.text).toBe("hi We are on the way.");
        expect(edit.selectionEnd).toBe(edit.text.length);
      },
    );
  },
);
