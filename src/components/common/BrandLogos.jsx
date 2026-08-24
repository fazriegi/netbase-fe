import React from "react";

/**
 * NetBase Custom Brand Logo using public/logo.svg
 */
export const NetBaseLogo = ({ size = 28, style = {}, className = "" }) => (
  <img
    src="/logo.svg"
    alt="NetBase Logo"
    width={size}
    height={size}
    className={className}
    style={{
      display: "inline-block",
      verticalAlign: "middle",
      objectFit: "contain",
      ...style,
    }}
  />
);
