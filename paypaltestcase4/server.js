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

const shippingAddress = {
  recipientName: "John Smith",
  street: "100 Queen Street",
  street2: "201",
  city: "Toronto",
  state: "ON",
  country: "CA",
  zip: "MSH 2N2",
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.listen(port, () => console.log("Example app listening on port " + port));

app.get("/shippingaddress", (req, res) => {
  res.status(200).json(shippingAddress);
});

app.post("/payandsettle", async (req, res) => {
  const paymentToken = req.body.token;
  console.log("Payment token received: ", paymentToken);

  try {
    const initialPayment = await fetchInitialPaymentFromToken(paymentToken);
    console.log("Initial Payment details fetched: ", JSON.stringify(initialPayment, null, 2));

    if (isShippingAddressEqual(initialPayment.shippingDetails, shippingAddress)) {
      let tokenizedPaymentRequest = {
        method: "POST",
        uri: ENV_URL + "/alternatepayments/v1/accounts/" + FMA + "/payments",
        body: {
          amount: 105,
          merchantRefNum: uuidV4(),
          paymentType: "PAYPAL",
          settleWithAuth: false,
          paymentToken: initialPayment.paymentToken
        },
        headers: headers,
        json: true,
      };
      const tokenizedPaymentResponse = await createPayment(tokenizedPaymentRequest);
      console.log("Tokenized payment response: ", JSON.stringify(tokenizedPaymentResponse, null, 2));

      if (tokenizedPaymentResponse.status === "COMPLETED") {
        res.status(200).send({ status: "success" });
      } else {
        res.status(500).send({ error: "Payment failed." });
      }
      const settlement = await createSettlement(tokenizedPaymentResponse);
      console.log("Settlement response: ", JSON.stringify(settlement, null, 2));
    } else {
      res.status(500).send({ error: "Invalid shipping address. Payment failed." });
    }
  } catch (e) {
    console.log("Internal server error.", e.message);
    res.status(500).send({ error: "Internal server error." });
  }
});

const fetchInitialPaymentFromToken = (paymentToken) => {
  return rp({
    method: "POST",
    uri: ENV_URL + "/alternatepayments/v1/accounts/" + FMA + "/initialpayments/paymenttoken",
    body: { paymentToken: paymentToken },
    headers: headers,
    json: true,
  });
};

const createSettlement = (tokenizedPaymentResponse) => {
  let settlementRequest = {
    method: "POST",
    uri: ENV_URL + "/alternatepayments/v1/accounts/" + FMA + "/payments/" + tokenizedPaymentResponse.id + "/settlements",
    body: {
      merchantRefNum: uuidV4(),
      currency: "USD",
      amount: 105,
    },
    headers: headers,
    json: true,
  };
  return rp(settlementRequest);
}

const createPayment = (tokenizedPaymentRequest) => {
  return rp(tokenizedPaymentRequest);
};

const isShippingAddressEqual = (first, second) => {
  return JSON.stringify(first) === JSON.stringify(second);
};
