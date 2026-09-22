import "server-only";

import webpush from "web-push";

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;

if (!publicKey) {
  throw new Error("Missing VAPID_PUBLIC_KEY");
}

if (!privateKey) {
  throw new Error("Missing VAPID_PRIVATE_KEY");
}

if (!subject) {
  throw new Error("Missing VAPID_SUBJECT");
}

webpush.setVapidDetails(
  subject,
  publicKey,
  privateKey
);

export { webpush };