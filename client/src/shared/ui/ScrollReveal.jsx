import React from "react";
import { motion as Motion } from "motion/react";
import { fadeInUp, VIEWPORT_CONFIG } from "@/shared/config/animation";

export default function ScrollReveal({
  children,
  variants = fadeInUp,
  className = "",
  delay = 0,
}) {
  return (
    <Motion.div
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_CONFIG}
      variants={variants}
      transition={{ delay }}
      className={className}
    >
      {children}
    </Motion.div>
  );
}
