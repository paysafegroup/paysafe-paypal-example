# PayPal DEMO project
This demo features sample integrations with PayPal through Paysafe Checkout or APM API. Each scenario has to be run separately
and they cover 4 different payment flows and a payout(standalone credit batch) flow.  

## Project Setup
* Node version 8 is required
* Each test case should be built using:

```
npm install
```

* To start the test server run:

```
npm start
```

* Your server will be available on http://localhost:3002 or http://127.0.0.1:3002.

* To be able to receive webhooks your local environment have to be publicly accessible. One way is to install ngrok (https://ngrok.com/download)
* ngrok should be started using

```
ngrok http 3002
```

* Your test server is now also available on the URL ngrok provided you.

* Create your test account.
 
```
Follow the steps on https://developer.paysafe.com/en/sdks/paysafe-checkout/overview/

Replace place holders YOUR_PRIVATE_API_KEY and YOUR_FMA in server.js files 
with your private api key and FMA.
```

* Test accounts should be configured to send notifications to local ngrok

```
Log into: https://login.test.netbanx.com/office/public/preLogin.htm

Go to Settings/Notifications and change the Callback URL to point to local ngrok.

The notification URL is http://<ngrok_url_to_your_local_evn>:3002/notify
```

# PayPal Scenarios

PayPal has quite a few features and scenarios that it supports and requires its merchants to follow. For all these, we have a ready-made project, that demonstrates some basic flows.

## Scenarios

The project covers the following scenarios:

### Scenario 1: PayPal w/ APM API, intentSale = true. 
Gambling merchant initiates the payment via his backend. <code>forceIntentSale</code> flag is set to <code>true</code>. Merchant should use the <code>/initialpayments</code> endpoint in order to be able to verify <code>payerId</code> before finalizing the transaction.

Merchant should be able to verify the <code>payerId</code> before finalizing the transaction. It is returned from the initial payment lookup endpoint, which should be triggered before token is consumed. The merchant should be able to get the payerid before finishing the transaction.

### Scenario 2: PayPal w/ APM API, intentSale = false. 
Retail 2-step flow. Merchant initiates a payment through his backend. After receiving payment COMPLETED callback merchant manually initiates a settlement.

### Scenario 3: PayPal w/ Paysafe Checkout, intentSale = true.
Gambling merchant using Paysafe Checkout. <code>forceIntentSale</code> flag is set to <code>true</code>.
  
Merchant should be able to verify the <code>payerId</code> before finalizing the transaction. It is returned from the token lookup endpoint, which should be triggered before token is consumed.

### Scenario 4: PayPal w/ Paysafe Checkout, intentSale = false.
Retail 2-step flow using Paysafe checkout. Merchant should be able to obtain the shipping address to qualify for seller protection, before finishing the transaction. After receiving payment COMPLETED callback merchant manually initiates a settlement.

### Scenario 5: PayPal w/ APM API, standalone credit batch.
Gambling merchant initiates a standalone credit batch via his backend.