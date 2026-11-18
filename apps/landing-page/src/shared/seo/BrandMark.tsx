/**
 * The app mark (yellow tile, black outlined truck) as inline SVG for the generated social and
 * Apple icons. Same artwork as the tile in public/brand/logo.png.
 */
export function BrandMark({
  size,
  rounded = true,
}: {
  size: number;
  rounded?: boolean;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <rect
        width="256"
        height="256"
        rx={rounded ? 58 : 0}
        fill="#FFC105"
      />
      <g
        fill="none"
        stroke="#000000"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M58 166V84A8 8 0 0 1 66 76H146V166" />
        <path d="M146 106H178L202 136V166H188" />
        <path d="M118 166H146" />
        <path d="M58 166H70" />
        <circle
          cx="94"
          cy="170"
          r="22"
        />
        <circle
          cx="166"
          cy="170"
          r="22"
        />
      </g>
    </svg>
  );
}
