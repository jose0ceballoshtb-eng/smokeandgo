 The server listens on the port defined by the `PORT` environment variable (default `3000`) and writes files to `mujeres desesperadas/user_<timestamp>.json`.
 When testing on Android emulator, set `SAVE_HOST` to `10.0.2.2` or set `SAVE_URL` explicitly. The mobile app reads `SAVE_URL`/`SAVE_HOST`/`SAVE_PORT` from environment variables and falls back to `http://localhost:3000`.

If you don't run this server, the app will still save `user.json` on the device and continue to work normally.
