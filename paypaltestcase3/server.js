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

app.post("/payandsettle", async (req, res) => {
  const paymentToken = req.body.token;
  console.log("Payment token received: ", paymentToken);

  try {
    const initialPayment = await fetchInitialPaymentFromToken(paymentToken);
    console.log("Initial Payment details fetched: ", JSON.stringify(initialPayment, null, 2));

    if (verifyPayerId(initialPayment.gatewayResponse.payerId)) {
      let tokenizedPaymentRequest = {
        method: "POST",
        uri: ENV_URL + "/alternatepayments/v1/accounts/" + FMA + "/payments",
        body: {
          amount: 105,
          merchantRefNum: uuidV4(),
          paymentType: "PAYPAL",
          settleWithAuth: true,
          paymentToken: initialPayment.paymentToken
        },
        headers: headers,
        json: true,
      };
      const tokenizedPaymentResponse = await payAndSettle(tokenizedPaymentRequest);
      console.log("Tokenized payment response: ", JSON.stringify(tokenizedPaymentResponse, null, 2));

      if (tokenizedPaymentResponse.status === "COMPLETED") {
        res.status(200).send({ status: "success" });
      } else {
        res.status(500).send({ error: "Payment failed." });
      }
    } else {
      res.status(500).send({ error: "Payer id verification failed. Payment aborted." });
    }
  } catch (e) {
    console.log("Internal server error: ", e.message);
    res.status(500).send({ error: "Internal server error." });
  }
});

const fetchInitialPaymentFromToken = (paymentToken) => {
  return rp({
    method: "POST",
    uri: ENV_URL + "/alternatepayments/v1/accounts/" + FMA + "/initialpayments/paymenttoken",
    body: {
      paymentToken: paymentToken
    },
    headers: headers,
    json: true,
  });
};

const payAndSettle = (tokenizedPaymentRequest) => {
  return rp(tokenizedPaymentRequest);
};

const verifyPayerId = (payerId) => {
  console.log("PayerId: " + payerId);
  return typeof payerId !== "undefined";
};
