"use client";

type Listener = (hidden: boolean) => void;

let hidden = false;
const listeners = new Set<Listener>();

export function getNavbarHidden(): boolean {
  return hidden;
}

export function subscribeNavbarHidden(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setNavbarHidden(value: boolean): void {
  if (value === hidden) return;
  hidden = value;
  listeners.forEach((l) => l(value));
}
