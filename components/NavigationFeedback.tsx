"use client";
import { useLinkStatus } from "next/link";

export default function NavigationFeedback() {
  const { pending } = useLinkStatus();
  return <span className="navigation-feedback" data-pending={pending}>
    <span className="navigation-feedback-dot" aria-hidden="true" />
    {pending && <span role="status" className="sr-only">Opening menu...</span>}
  </span>;
}
