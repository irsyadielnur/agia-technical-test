import { Variants } from "framer-motion";

export const staggerContainer = (
  staggerChildren = 0.3,
  delayChildren = 0.1,
): Variants => {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren,
        delayChildren,
      },
    },
  };
};

export const slideIn = (
  direction: "left" | "right" | "up" | "down",
  delay: number,
  duration = 1,
): Variants => {
  const transitionConfig = {
    type: "spring" as const,
    bounce: 0.5,
    duration,
    ease: "easeOut" as const,
    ...(delay > 0 ? { delay } : {}),
  };

  return {
    hidden: {
      x: direction === "left" ? -200 : direction === "right" ? 200 : 0,
      y: direction === "up" ? 200 : direction === "down" ? -200 : 0,
      opacity: 0,
    },
    visible: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: transitionConfig,
    },
    exit: {
      x: direction === "left" ? 200 : direction === "right" ? -200 : 0,
      y: direction === "up" ? -200 : direction === "down" ? 200 : 0,
      opacity: 0,
      transition: {
        duration: duration * 0.4,
        ease: "easeInOut",
      },
    },
  };
};

export const fadeInUp = (
  delay = 0,
  yOffset = 15,
  duration = 0.5,
  ease?: any,
): Variants => {
  return {
    hidden: { opacity: 0, y: yOffset },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        ...(ease
          ? { type: "tween" as const, ease, duration }
          : { type: "spring" as const, stiffness: 100, damping: 15 }),
        delay,
      },
    },
  };
};

export const slideSwitch = (offset = 150): Variants => {
  return {
    enter: (dir: number) => ({
      x: dir > 0 ? offset : -offset,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? offset : -offset,
      opacity: 0,
    }),
  };
};
