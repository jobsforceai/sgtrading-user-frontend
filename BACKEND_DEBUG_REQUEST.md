# Frontend Debugging Request for Backend Team

Hi Team,

We're encountering an issue on the frontend where, despite a successful login, no user data (wallet, instruments, trades, etc.) is being displayed on the application's main pages like `/trade`. The user is authenticated successfully and receives valid tokens, but all subsequent API calls for data appear to return empty.

We have debugged the frontend extensively based on the `FRONTEND_INTEGRATION_GUIDE.md` and would appreciate your help investigating the backend behavior.

### Summary of the Issue

1.  **Successful Login:** The user logs in via `/auth/login/password`.
2.  **Correct Response Received:** The frontend receives a valid response containing the `user` object and `tokens` (accessToken, refreshToken). We have verified this with console logs.
3.  **Redirect to `/trade`:** The user is redirected to the main trading page.
4.  **No Data Displayed:** The page remains in a loading or empty state. API calls to fetch initial data (`/markets/instruments`, `/trades/open`, `/wallets/me`) are being made, but they seem to return empty or unauthorized responses.

### Frontend Actions Already Taken & Verified

- **Socket.IO Client:** We have confirmed `socket.io-client` is version `^4.8.1`.
- **WebSocket Events:** We have corrected our listeners to use the `market:tick` (singular) event and are correctly emitting `market:subscribe` with a symbol after connection.
- **Data Payload:** We have verified that the frontend code correctly reads the `data.last` field (not `data.price`) from the `market:tick` payload.
- **Token Handling:** We have a global Axios interceptor that correctly attaches the `accessToken` to all subsequent API requests.
- **Invalid Token Errors:** We have implemented a global error handler that forces a logout if a `401 Unauthorized` error with the message "Invalid token" is received. This is working as expected.

### Our Questions for the Backend Team

1.  **Token Validation:** Could you please confirm if the `accessToken` is being correctly received and validated for API requests made *after* the initial login? While the login itself works, we suspect subsequent requests might be failing authentication silently.

2.  **Data Endpoint Behavior:** Are there any other required headers or parameters for the main data endpoints (`/markets/instruments`, `/trades/open`, `/wallets/me`) that might not be in the documentation?

3.  **WebSocket Subscriptions:** Can you see our `market:subscribe` events in the backend logs? We need to confirm that the server is successfully subscribing our client to the requested data feeds after connection.

4.  **New User State:** Is it the *expected behavior* for a new user (or a user with no trading history) to receive empty arrays `[]` from all data endpoints? We want to rule out the possibility that the empty data is correct and not an error.

5.  **Server-Side Logs:** Could you please inspect the backend logs for any errors associated with the user ID `6927f20f16ec163082197973` for the timeframe immediately following a successful login? Specifically, we're interested in any issues related to requests for instruments, trades, and wallet data.

Thank you for your help in resolving this.
