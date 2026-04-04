"use client";

import React from "react";
import { ParticleLayer } from "./particle-layer";

interface IndexProps {
  event: string;
}

export function HolidayEffects({ event }: IndexProps) {
  if (event === "none") return null;

  return (
    <>
      <ParticleLayer event={event} />
    </>
  );
}
