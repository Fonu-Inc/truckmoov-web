import type { FigmaLines as FigmaLinesData } from "./product-types";
import { Fragment } from "react";

type FigmaLinesProps = { lines: FigmaLinesData };

/** Renders copy with the Figma line breaks on `lg+`; the breaks are hidden on smaller screens. */
export default function FigmaLines({ lines }: FigmaLinesProps) {
  return lines.map((line, index) => (
    // Lines are static copy, never reordered.
    // eslint-disable-next-line react/no-array-index-key
    <Fragment key={index}>
      {index > 0 && " "}
      {line}
      {index < lines.length - 1 && <br className="max-lg:hidden" />}
    </Fragment>
  ));
}
