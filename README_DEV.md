Dev instructions: receive exported user files

To have the app save copies of registrations into the repository folder `mujeres desesperadas`, run the small development receiver on your machine before testing the app.

Run (requires Node.js):

```bash
node dev/save_receiver.js
```

- The server listens on port 4000 and writes files to `mujeres desesperadas/user_<timestamp>.json`.
- When testing on Android emulator, the app will try `http://10.0.2.2:4000/save` (emulator host). It will also try `http://localhost:4000/save` as fallback.

If you don't run this server, the app will still save `user.json` on the device and continue to work normally.
