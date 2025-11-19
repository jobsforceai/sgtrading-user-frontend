# User API Documentation

This document provides a clear overview of the user-related API endpoints for the sgtrading-backend project.

## Base URL

All API endpoints are prefixed with `/api/v1`.

## Symbol Formats

It is crucial to use the correct symbol format for each API endpoint:

*   **Cryptocurrencies (Real-time quotes via `/markets/quotes` and WebSocket):** Use **Binance lowercase symbols** (e.g., `btcusdt`, `ethusdt`).
*   **Forex, Stocks, Commodities (Historical data via `/markets/candles`):** Use **Yahoo Finance symbols** (e.g., `EURUSD=X`, `AAPL`, `GLD`).
*   **Stocks (Real-time quotes via `/markets/quotes`):** Use **standard stock tickers** (e.g., `AAPL`, `TSLA`).

---

## Authentication

### 1. Register a new user

*   **Endpoint:** `POST /auth/register`
*   **Description:** Creates a new user account.
*   **Request Body:**
    ```json
    {
      "email": "user@example.com",
      "fullName": "John Doe",
      "password": "password123"
    }
    ```
*   **Response (201 CREATED):**
    ```json
    {
      "user": {
        "email": "user@example.com",
        "fullName": "John Doe",
        "roles": ["USER"],
        "kycStatus": "PENDING",
        "onChainAddress": "0x...",
        "_id": "...",
        "createdAt": "...",
        "updatedAt": "..."
      }
    }
    ```

### 2. Request an OTP

*   **Endpoint:** `POST /auth/otp/request`
*   **Description:** Sends a One-Time Password (OTP) to the user's email for login.
*   **Request Body:**
    ```json
    {
      "email": "user@example.com"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "OTP sent successfully"
    }
    ```

### 3. Login with OTP

*   **Endpoint:** `POST /auth/login`
*   **Description:** Verifies the OTP and returns JWT tokens for authentication.
*   **Request Body:**
    ```json
    {
      "email": "user@example.com",
      "otp": "123456"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "user": {
        "email": "user@example.com",
        "fullName": "John Doe",
        ...
      },
      "tokens": {
        "accessToken": "...",
        "refreshToken": "..."
      }
    }
    ```

---

## User

### 1. Get my profile

*   **Endpoint:** `GET /users/me`
*   **Authentication:** Bearer Token required.
*   **Description:** Retrieves the profile of the currently authenticated user.
*   **Response (200 OK):**
    ```json
    {
      "email": "user@example.com",
      "fullName": "John Doe",
      "roles": ["USER"],
      "kycStatus": "PENDING",
      "onChainAddress": "0x...",
      "_id": "...",
      "createdAt": "...",
      "updatedAt": "..."
    }
    ```

---

## Wallets

### 1. Get my wallet

*   **Endpoint:** `GET /wallets/me`
*   **Authentication:** Bearer Token required.
*   **Description:** Retrieves the wallet information of the currently authenticated user.
*   **Response (200 OK):**
    ```json
    {
      "_id": "...",
      "userId": "...",
      "liveBalanceUsd": 0,
      "demoBalanceUsd": 1000000,
      "currency": "USD",
      "createdAt": "...",
      "updatedAt": "..."
    }
    ```

---

## Market

### 1. Get all instruments

*   **Endpoint:** `GET /markets/instruments`
*   **Authentication:** None required.
*   **Description:** Retrieves a list of all tradable instruments.
*   **Response (200 OK):**
    ```json
    [
      {
        "_id": "...",
        "symbol": "btcusdt",
        "displayName": "Bitcoin / Tether",
        "type": "CRYPTO",
        "isEnabled": true,
        "decimalPlaces": 2,
        "minStakeUsd": 10,
        "maxStakeUsd": 1000,
        "defaultPayoutPercent": 85,
        "createdAt": "...",
        "updatedAt": "..."
      },
      {
        "_id": "...",
        "symbol": "AAPL",
        "displayName": "Apple Inc.",
        "type": "STOCK",
        "isEnabled": true,
        "decimalPlaces": 2,
        "minStakeUsd": 20,
        "maxStakeUsd": 1000,
        "defaultPayoutPercent": 80,
        "createdAt": "...",
        "updatedAt": "..."
      },
      {
        "_id": "...",
        "symbol": "EURUSD=X",
        "displayName": "EUR/USD",
        "type": "FOREX",
        "isEnabled": true,
        "decimalPlaces": 5,
        "minStakeUsd": 1,
        "maxStakeUsd": 200,
        "defaultPayoutPercent": 90,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
    ```

### 2. Get a quote

*   **Endpoint:** `GET /markets/quotes?symbol={symbol}`
*   **Authentication:** None required.
*   **Description:** Retrieves the latest price quote for a specific instrument symbol.
*   **URL Parameters:**
    *   `symbol` (string, required): The symbol of the instrument (e.g., `btcusdt` for crypto, `AAPL` for stocks).
*   **Response (200 OK):**
    ```json
    {
      "symbol": "btcusdt",
      "last": 65000.15,
      "ts": 1678886400000
    }
    ```

### 3. Get Historical Candlestick Data

*   **Endpoint:** `GET /markets/candles`
*   **Authentication:** None required.
*   **Description:** Retrieves historical candlestick data for a given symbol, used for drawing trading charts.
*   **Query Parameters:**
    *   `symbol` (string, required): The symbol of the instrument (e.g., `AAPL`, `OANDA:EUR_USD`).
    *   `resolution` (string, required): The timeframe for each candle. Supported values: `1`, `5`, `15`, `30`, `60` (for minutes), `D` (Day), `W` (Week), `M` (Month).
    *   `from` (number, required): The start of the date range as a UNIX timestamp (seconds since epoch).
    *   `to` (number, required): The end of the date range as a UNIX timestamp (seconds since epoch).
*   **Example Request:**
    `/api/v1/markets/candles?symbol=AAPL&resolution=D&from=1572651390&to=1575243390`
*   **Response (200 OK):**
    ```json
    [
      {
        "time": 1572651390,
        "open": 255.8,
        "high": 257.3,
        "low": 255.3,
        "close": 257.2,
        "volume": 25000000
      },
      ...
    ]
    ```

#### Frontend Team Notes:

*   **Purpose:** This endpoint is the data source for the main trading chart.
*   **Charting Library:** We recommend using a lightweight, high-performance charting library like **[TradingView's Lightweight Charts](https://github.com/tradingview/lightweight-charts)** or **[ECharts](https://echarts.apache.org/en/index.html)**. These libraries are specifically designed to handle this candlestick data format.
*   **Implementation:**
    1.  When a user selects an instrument, you will need to make a call to this endpoint to fetch the initial historical data to display. A good default range would be the last 24 hours (`D` resolution) or the last few hours (`15` or `60` minute resolution).
    2.  The `from` and `to` parameters are UNIX timestamps in **seconds**. You can get the current timestamp using `Math.floor(Date.now() / 1000)`.
    3.  The `time` field in the response is also a UNIX timestamp. You will need to format this for display on the chart's time axis.
    4.  The chart should update its date range when the user pans or zooms, triggering new calls to this endpoint with updated `from` and `to` timestamps.

### 4. Creating a Real-Time Chart Effect (Frontend Guide)

True second-by-second trade data requires a WebSocket connection, which is a future architectural step. However, we can create a professional and convincing real-time effect by combining the historical candle data with the live quote endpoint.

**Strategy:**
1.  **Initial Load:** Fetch a history of 1-minute candles from `GET /markets/candles` to draw the main chart.
2.  **Live Updates:** Poll the `GET /markets/quotes` endpoint at a high frequency (e.g., every 2-5 seconds) to get the latest price.
3.  **Update the Chart:** Use the live quote to update the closing price of the last candle on the chart.

**Implementation Steps:**

1.  **Load Historical Data:** When the chart component mounts or the symbol changes, call `GET /markets/candles?symbol={symbol}&resolution=1&from={...}&to={...}` to get the last few hours of data. Use this data to render the initial chart.

2.  **Start Polling for Live Quotes:** Use a `setInterval` to call `GET /markets/quotes?symbol={symbol}` every 2-5 seconds.

3.  **Update the Last Candle:** When you receive a response from `/quotes`, get the `last` price and use your charting library's API to update the most recent candle.
    *   For **TradingView Lightweight Charts**, you would use the `series.update()` method on your candlestick series with the new data point.
    *   This will make the last candle on the chart visually tick up and down, reflecting the live market price.

4.  **Handle New Candles:** The charting library will automatically create a new 1-minute candle at the start of the next minute. Your polling and update logic will then begin updating this new candle.

This hybrid approach provides a smooth, real-time user experience using the available backend infrastructure.

---

## Trading

### 1. Create a new trade

*   **Endpoint:** `POST /trades`
*   **Authentication:** Bearer Token required.
*   **Description:** Opens a new trade position.
*   **Request Body:**
    ```json
    {
      "mode": "LIVE",
      "symbol": "btcusdt",
      "direction": "UP",
      "stakeUsd": 100,
      "expirySeconds": 60
    }
    ```
*   **Response (201 CREATED):**
    ```json
    {
      "_id": "...",
      "userId": "...",
      "walletId": "...",
      "mode": "LIVE",
      "instrumentSymbol": "btcusdt",
      "direction": "UP",
      "stakeUsd": 100,
      "payoutPercent": 85,
      "entryPrice": 65000.15,
      "status": "OPEN",
      "outcome": null,
      "requestedExpirySeconds": 60,
      "openAt": "...",
      "expiresAt": "...",
      "createdAt": "...",
      "updatedAt": "..."
    }
    ```

### 2. Get open trades

*   **Endpoint:** `GET /trades/open`
*   **Authentication:** Bearer Token required.
*   **Description:** Retrieves all of the user's currently open trades.
*   **Response (200 OK):**
    ```json
    [
      {
        "_id": "...",
        "userId": "...",
        "status": "OPEN",
        ...
      }
    ]
    ```

### 3. Get trade history

*   **Endpoint:** `GET /trades/history`
*   **Authentication:** Bearer Token required.
*   **Description:** Retrieves the user's history of settled trades, with pagination.
*   **Query Parameters:**
    *   `mode` (string, optional): Filter by `LIVE` or `DEMO`.
    *   `limit` (number, optional, default: 10): Number of trades per page.
    *   `page` (number, optional, default: 1): The page number to retrieve.
*   **Response (200 OK):**
    ```json
    [
      {
        "_id": "...",
        "userId": "...",
        "status": "SETTLED",
        "outcome": "WIN",
        ...
      }
    ]
    ```
