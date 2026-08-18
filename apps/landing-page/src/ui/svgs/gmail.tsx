import type { SVGProps } from "react";

export function GmailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="25"
      height="26"
      viewBox="0 0 25 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g filter="url(#gmail-filter)">
        <path
          d="M2 8.96667C2 6.35309 2 5.0463 2.50864 4.04804C2.95605 3.16995 3.66995 2.45605 4.54804 2.00864C5.5463 1.5 6.85309 1.5 9.46667 1.5H15.5333C18.1469 1.5 19.4537 1.5 20.452 2.00864C21.33 2.45605 22.044 3.16995 22.4914 4.04804C23 5.0463 23 6.35309 23 8.96667V15.0333C23 17.6469 23 18.9537 22.4914 19.952C22.044 20.83 21.33 21.544 20.452 21.9914C19.4537 22.5 18.1469 22.5 15.5333 22.5H9.46667C6.85309 22.5 5.5463 22.5 4.54804 21.9914C3.66995 21.544 2.95605 20.83 2.50864 19.952C2 18.9537 2 17.6469 2 15.0333V8.96667Z"
          fill="white"
        />
        <path
          d="M17.0385 6.39209L12.5482 9.89641L7.9552 6.39209V6.39304L7.96075 6.39777V11.3048L12.4964 14.8848L17.0385 11.443V6.39209Z"
          fill="#EA4335"
        />
        <path
          d="M18.2176 5.53979L17.0383 6.39219V11.4431L20.749 8.59423V6.87806C20.749 6.87806 20.2986 4.42693 18.2176 5.53979Z"
          fill="#FBBC05"
        />
        <path
          d="M17.0383 11.4432V17.9943H19.8824C19.8824 17.9943 20.6916 17.911 20.7499 16.9885V8.59424L17.0383 11.4432Z"
          fill="#34A853"
        />
        <path
          d="M7.96096 18.0002V11.305L7.9552 11.3003L7.96096 18.0002Z"
          fill="#C5221F"
        />
        <path
          d="M7.9551 6.3934L6.78234 5.54573C4.70135 4.43288 4.25 6.88306 4.25 6.88306V8.59922L7.9551 11.3004V6.3934Z"
          fill="#C5221F"
        />
        <path
          d="M7.9552 6.39307V11.3001L7.96096 11.3048V6.3978L7.9552 6.39307Z"
          fill="#C5221F"
        />
        <path
          d="M4.25 8.6001V16.9944C4.30734 17.9178 5.11754 18.0002 5.11754 18.0002H7.96158L7.9551 11.3003L4.25 8.6001Z"
          fill="#4285F4"
        />
      </g>
      <defs>
        <filter
          id="gmail-filter"
          x="-1.5"
          y="-1"
          width="28"
          height="28"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood
            floodOpacity="0"
            result="BackgroundImageFix"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.0627451 0 0 0 0 0.0941176 0 0 0 0 0.156863 0 0 0 0.05 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_61_3501"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_61_3501"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
}
