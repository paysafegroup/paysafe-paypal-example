"use strict";

const rp = require("request-promise");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3002;
const uuidV4 = require("uuid/v4");
const privateApiKey = "YOUR_PRIVATE_API_KEY";
const FMA = "YOUR_FMA";
const ENV_URL = "https://api.test.paysafe.com";
const headers = {
  "Content-Type": "application/json",
  "Authorization": "Basic " + privateApiKey,
  "Live-mode": false,
  "Simulator": "EXTERNAL"
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.listen(port, () => console.log("Example app listening on port " + port));

app.post("/pay", async (req, res) => {
  let request = {
    method: "POST",
    uri: ENV_URL + "/alternatepayments/v1/accounts/" + FMA + "/initialpayments",
    body: {
      merchantRefNum: uuidV4(),
      amount: 105,
      currency: "CAD",
      paymentType: "PAYPAL",
      returnLinks: [
        {
          rel: "default",
          href: "https://example.com",
        }],
    },
    headers: headers,
    json: true,
  };
  const response = await createPayment(request);

  console.log("Payment created: ", JSON.stringify(response, null, 2));
  res.status(200).json({
    links: response.links,
  });
});

app.post("/notify", async (req, res) => {
  res.sendStatus(200);

  await processWaitingFinalization(req.body);
  processOtherEvents(req.body);
});

const createPayment = (request) => {
  return rp(request);
};

const checkPaymentStatus = (link) => {
  return rp({
    method: "GET",
    uri: link,
    headers: headers,
    json: true,
  });
};

const processWaitingFinalization = async (notification) => {
  try {
    console.log("Notification received: ", JSON.stringify(notification, null, 2));
    if (notification.eventType !== "AP_IP_WAITING_FINALIZATION") {
      return;
    }

    const payment = await checkPaymentStatus(notification.links[0].href);
    console.log("Payment status: ", payment.status);

    if (verifyPayerId(payment.gatewayResponse.payerId)) {
      let tokenizedPaymentRequest = {
        method: "POST",
        uri: ENV_URL + "/alternatepayments/v1/accounts/" + FMA + "/payments",
        body: {
          amount: 105,
          merchantRefNum: uuidV4(),
          paymentType: "PAYPAL",
          settleWithAuth: true,
          paymentToken: payment.paymentToken
        },
        headers: headers,
        json: true,
      }
      const tokenizedPaymentResponse = await payAndSettle(tokenizedPaymentRequest);
      console.log("Tokenized payment response: ", JSON.stringify(tokenizedPaymentResponse, null, 2));
    } else {
      console.log("Payer id verification failed. Payment aborted.");
    }
  } catch (e) {
    console.log("Internal Error. ", e.message);
  }
};

const processOtherEvents = (notification) => {
  if (notification.eventType === "AP_IP_WAITING_FINALIZATION") {
    return;
  }
  console.log("Settlement notification received: ", JSON.stringify(notification, null, 2));
};

const payAndSettle = (tokenizedPaymentRequest) => {
  return rp(tokenizedPaymentRequest);
};

const verifyPayerId = (payerId) => {
  console.log("PayerId: " + payerId);
  return typeof payerId !== "undefined";
};
