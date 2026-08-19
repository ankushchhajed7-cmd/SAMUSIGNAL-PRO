/* ==================================================================
   SamuSignal Pro — configuration
   ------------------------------------------------------------------
   This is the ONLY file you need to edit.
   Open setup.html in a browser and it will fill this in for you.
   ================================================================== */

window.SAMU_CONFIG = {

  /* Firebase Realtime Database URL.
     Firebase console > Realtime Database, the link shown at the top.
     Example: https://samusignal-pro-default-rtdb.asia-southeast1.firebasedatabase.app */
  db: 'https://samusignal-pro-default-rtdb.asia-southeast1.firebasedatabase.app',

  /* Not needed here. The admin console asks for this on its own Connect
     screen and stores it on that device, so the app never carries it. */
  apiKey: '',

  /* 'direct' = UPI QR + you activate manually  (APK build, 0% fee)
     'play'   = Google Play Billing             (Play Store build)   */
  mode: 'direct',

  /* Play Console in-app product ID. Only used when mode is 'play'. */
  sku: 'samusignal_pro_lifetime',

  /* Free trial length in days. */
  trialDays: 7,

  /* Price shown on the lock screen. */
  price: '₹4,999'
};
