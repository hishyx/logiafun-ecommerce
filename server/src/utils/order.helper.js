export const generateOrderNumber = () => {
  const now = new Date();

  const datePart =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");

  const timePart =
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");

  const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit random

  return `LF-${datePart}-${timePart}-${randomPart}`;
};

export const generateCheckoutId = () => {
  const timestamp = Date.now(); // milliseconds
  const randomPart = Math.floor(100 + Math.random() * 900);

  return `CHK-${timestamp}-${randomPart}`;
};
