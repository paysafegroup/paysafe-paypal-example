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

let status = "";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.listen(port, () => console.log("Example app listening on port " + port));

app.post("/payout", async (req, res) => {
  let request = {
    method: "POST",
    uri: ENV_URL + "/alternatepayments/v1/accounts/" + FMA + "/standalonecreditbatches?fields=standaloneCredits",
    body: {
      merchantRefNum: uuidV4(),
      dupCheck: false,
      totalAmount: 300,
      numberOfItems: 2,
      paymentType: "PAYPAL",
      standaloneCredits: [
        {
          merchantRefNum: "TestCreditNejc001",
          dupCheck: false,
          amount: 160,
          paymentType: "PAYPAL",
          paypal: {
            recipientType: "PAYPAL_ID",
            consumerId: "2AGQAPZCY4XSQ",
            consumerMessage: "test 1"
          },
          consumerIp: "206.172.46.138"
        },
        {
          merchantRefNum: "TestCreditNejc002",
          dupCheck: false,
          amount: 140,
          paymentType: "PAYPAL",
          paypal: {
            recipientType: "PAYPAL_ID",
            consumerId: "2AGQAPZCY4XSQ",
            consumerMessage: "test 2"
          },
          consumerIp: "206.172.46.138"
        }
      ],
      returnLinks: [
        {
          rel: "default",
          href: "https://example.com",
        }],
    },
    headers: headers,
    json: true,
  };
  const response = await createPayout(request);

  console.log("Payout created: ", JSON.stringify(response, null, 2));
  status = response.status;
  res.status(200).json({
    status: response.status,
    links: response.links,
  });
});

app.post("/notify", async (req, res) => {
  res.sendStatus(200);
  status = req.body.payload.status;
  console.log("Payout notification received", JSON.stringify(req.body, null, 2))
});

app.get("/status", async (req, res) => {
  res.status(200).json({
    status: status,
  });
});

const createPayout = (request) => {
  return rp(request);
};
