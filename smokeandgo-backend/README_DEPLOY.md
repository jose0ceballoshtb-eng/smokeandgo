Render deployment steps

1. Create a Render account and connect your GitHub repo.
2. Create a new Web Service for the backend:
   - Environment: Node
   - Build Command: `npm ci`
   - Start Command: `npm start`
   - Port: 3000
   - Set environment variables (DATABASE_URL or DB_* variables, JWT_SECRET, REG_EXPORT_DIR if needed)

3. (Optional) Create a second Web Service for the receiver:
   - Build Command: `npm ci`
   - Start Command: `node src/receiver.js`
   - Port: 4000

4. Ensure the Render service has access to persistent storage or adapt the receiver to write to an external storage (S3) for production.

5. After deployment, update the mobile app `API_BASE` and `FILE_API_BASE` to point to the Render public URLs.
