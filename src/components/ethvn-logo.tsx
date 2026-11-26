import type { SVGProps } from "react";

/**
 * The ETH.vn mark without its black tile. It fills with `currentColor`, so it
 * takes the surrounding text colour and sits on the app background in both themes.
 * The viewBox is cropped to the mark. Same path as `public/ethvn-symbol.svg`: keep the two in step.
 */
export function EthvnLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="66 37 244 301"
      fill="currentColor"
      role="img"
      aria-label="ETH.vn"
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M66.18 127.84L86.71 130.4L187.68 37.51L288.64 130.4L309.18 127.84L292.07 152.56L187.68 123.58L83.29 152.56ZM136.34 153.75L187.68 139.5L239.02 153.75L239.02 231.63L187.68 242.55L136.34 231.63ZM163.72 191.03C163.72 197.36 166.24 203.43 170.73 207.9C175.23 212.38 181.32 214.89 187.68 214.89C194.03 214.89 200.13 212.38 204.62 207.9C209.11 203.43 211.63 197.36 211.63 191.03C211.63 184.7 209.11 178.63 204.62 174.16C200.13 169.68 194.03 167.16 187.68 167.16C181.32 167.16 175.23 169.68 170.73 174.16C166.24 178.63 163.72 184.7 163.72 191.03ZM93.56 165.63L120.94 158.03L120.94 228.36L93.56 222.53ZM281.8 165.63L254.41 158.03L254.41 228.36L281.8 222.53ZM75.59 234.37L187.68 258.23L299.76 234.37L187.68 337.49Z"
      />
    </svg>
  );
}
