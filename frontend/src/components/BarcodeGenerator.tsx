"use client";

import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeGeneratorProps {
  value: string;
  format?: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  text?: string;
  fontSize?: number;
  font?: string;
  textAlign?: "left" | "center" | "right";
  textPosition?: "top" | "bottom";
  textMargin?: number;
  background?: string;
  lineColor?: string;
  margin?: number;
  className?: string;
  id?: string;
}

export default function BarcodeGenerator({
  value,
  format = "CODE128",
  width = 2,
  height = 50,
  displayValue = true,
  text,
  fontSize = 14,
  font = "monospace",
  textAlign = "center",
  textPosition = "bottom",
  textMargin = 4,
  background = "#ffffff",
  lineColor = "#000000",
  margin = 6,
  className = "",
  id
}: BarcodeGeneratorProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        const cleanVal = String(value).trim() || "001";
        JsBarcode(svgRef.current, cleanVal, {
          format,
          width,
          height,
          displayValue,
          text: text !== undefined ? text : undefined,
          fontSize,
          font,
          textAlign,
          textPosition,
          textMargin,
          background,
          lineColor,
          margin
        });
      } catch (err) {
        console.error("Barcode generation failed for value:", value, err);
      }
    }
  }, [value, format, width, height, displayValue, text, fontSize, font, textAlign, textPosition, textMargin, background, lineColor, margin]);

  if (!value) {
    return <div className="text-xs text-slate-400 font-mono py-2">No barcode data</div>;
  }

  return (
    <div className={`flex justify-center items-center overflow-hidden ${className}`}>
      <svg id={id} ref={svgRef} className="max-w-full h-auto" />
    </div>
  );
}
