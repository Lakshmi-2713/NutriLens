# NutriLens - Advanced Habit & Nutrition Tracking

NutriLens is a web application designed to help users track their nutritional habits, analyze their diet, and maintain a healthy lifestyle through data-driven insights.

## 🚀 Quick Start

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Create a `.env` file in the root directory with:
   ```env
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_secret_key
   PORT=3000
   ```

3. **Run the Server**:
   ```bash
   node server.js
   ```

## 📂 Project Structure

### Backend (`/`)
- **`server.js`**: The core of the application. Handles Express server setup, MongoDB connection, API endpoints (Auth, Dashboard, Profile), and serves static files.
- **`models/User.js`**: Mongoose schema for user authentication and data.
- **`.env`**: Configuration for sensitive data (not tracked in Git).

### Frontend (`/public`)
- **`index.html`**: The landing page with product features and entry points for login/registration.
- **`login.html` & `register.html`**: Authentication interfaces.
- **`dashboard.html`**: The main user interface for tracking water, meditation, steps, and nutrition.
- **`css/`**: Contains page-specific styles (`home.css`, `login.css`, `dashboard.css`, etc.).
- **`js/`**:
  - **`home.js`**: Global utilities including Theme Management (Dark/Light mode) and Toast notifications.
  - **`login.js` & `register.js`**: Handle form submissions and API communication for authentication.
  - **`dashboard.js`**: Manages the dynamic rendering of the user's health data, habits, and meal plans.

## 🔄 Application Workflow

1. **Authentication**: Users can register or log in. Sessions are managed using JWT (stored in local storage).
2. **Dashboard**: Upon logging in, users are redirected to the dashboard which fetches real-time data from the backend.
3. **Personalization**: Users can update their profile (age, weight, diet type, and goals), which dynamically updates their daily calorie targets and macro distributions.
4. **Tracking**: Habits (like drinking water) can be toggled. Changes are persisted via API calls to the server.
5. **Theme**: A global theme toggle allows switching between Light and Dark modes across all pages, with the preference saved in the browser.
6. **Logout**: Safely clears session tokens and returns the user to the homepage.
