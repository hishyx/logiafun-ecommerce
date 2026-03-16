import crypto from "crypto";

function generateReferralCode(name) {
  const prefix = name.slice(0, 4).toUpperCase();
  const random = crypto.randomBytes(2).toString("hex").toUpperCase();
  return prefix + random;
}

export default generateReferralCode;
