async function placePaymentWithPopup(result) {
  if (result.razorpay) {
    const options = {
      key: result.key,
      amount: result.amount,
      currency: "INR",
      order_id: result.razorpayOrderId,
      name: "logiaFun Toys",
      description: "Test Transaction",
      // image: "https://example.com/your_logo",

      handler: async function (response) {
        await fetch("/verify-razorpay", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...response,
            orderId: result.orderId,
            userId: result.userId,
          }),
        });

        window.location.href = `/order/success/${result.orderNumber}?payment=true`;
      },
      modal: {
        ondismiss: async function () {
          //  USER CLOSED POPUP
          await fetch("/payment-failed", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderId: result.orderId,
              reason: "User closed payment popup",
            }),
          });

          window.location.href = `/order/failed?message=Payment cancelled&payment=true&orderId=${result.orderId}`;
        },
      },
    };

    const rzp = new Razorpay(options);

    //  PAYMENT FAILED EVENT
    rzp.on("payment.failed", async function (response) {
      await fetch("/payment-failed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: result.orderId,
          reason: response.error.description,
        }),
      });

      window.location.href = `/order/failed?message=${encodeURIComponent(response.error.description)}&payment=true&orderId=${result.orderId}`;
    });

    rzp.open();
  }
}
