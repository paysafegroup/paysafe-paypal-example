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
    uri: ENV_URL + "/alternatepayments/v1/accounts/" + FMA + "/payments",
    body: {
      merchantRefNum: uuidV4(),
      amount: 105,
      paymentType: "PAYPAL",
      settleWithAuth: false,
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

  await processPaymentCompleted(req.body);
  processOtherEvents(req.body);
});

const createPayment = (request) => {
  return rp(request);
};

const processPaymentCompleted = async (notification) => {
  try {
    if (notification.eventType !== "AP_PAYMENT_COMPLETED") {
      return;
    }
    console.log("Notification received: ", JSON.stringify(notification, null, 2));
    let settlementRequest = {
      method: "POST",
      uri: ENV_URL + "/alternatepayments/v1/accounts/" + FMA + "/payments/" + notification.resourceId + "/settlements",
      body: {
        merchantRefNum: uuidV4(),
        currency: "USD",
        amount: 105,
      },
      headers: headers,
      json: true,
    }
    const settlement = await createSettlement(settlementRequest);
    console.log("Settlement response: ", JSON.stringify(settlement, null, 2));
  } catch (e) {
    console.log("Internal Error. ", e.message);
  }
};

const createSettlement = (settlementRequest) => {
  return rp(settlementRequest);
};

const processOtherEvents = (notification) => {
  if (notification.eventType === "AP_PAYMENT_COMPLETED") {
    return;
  }
  console.log("Settlement notification received: ", JSON.stringify(notification, null, 2));
};
