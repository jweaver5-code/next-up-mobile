# NextUp mobile

Expo app for the NextUp API at https://next-up.capstone.uamishub.com. It uses the same accounts and database as the website. Sign-in lasts until you tap Sign out.

## Run it

Install [Android Studio](https://developer.android.com/studio) and start a virtual device, then:

```bash
npm start
```

Press `a` to open the Android emulator.

On an iPhone, install Expo Go from the App Store, join the same Wi-Fi as this PC, and scan the QR code from `npm start`. Windows cannot run an iOS simulator.

## Sign-in

The phone calls `/api/auth/mobile/login` and `/api/auth/mobile/register` on the existing API. Those routes are in the Next Up backend and have to be deployed before this app can sign in against the live site. The website keeps its cookie login.
