import { Fragment } from "react";

type LineBreaksProps = {
  /** Text whose "\n" marks a Figma line break. */
  text: string;
  /** Classes for each <br>; hidden by default and shown from `lg`, so small screens wrap naturally. */
  breakClassName?: string;
};

/** Renders `text` with its "\n" line breaks applied only on wide screens. */
export default function LineBreaks({
  text,
  breakClassName = "hidden lg:block",
}: LineBreaksProps) {
  const lines = text.split("\n");

  return lines.map((line, index) => (
    // Lines are static copy, so the index is a stable key.
    // eslint-disable-next-line react/no-array-index-key
    <Fragment key={index}>
      {line}
      {index < lines.length - 1 && (
        <>
          {" "}
          <br className={breakClassName} />
        </>
      )}
    </Fragment>
  ));
}
