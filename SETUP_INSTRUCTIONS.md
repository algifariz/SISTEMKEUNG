# Setup Instructions for Money Tracker (Supabase Version)

This guide will walk you through setting up the Money Tracker application to run with a Supabase backend.

## Prerequisites
- A Supabase account. You can create one for free at [supabase.com](https://supabase.com).
- A local web server to serve the static files. You can use the VS Code "Live Server" extension, Python's built-in server, or any other simple server.

## Step 1: Create a Supabase Project

1.  Go to your Supabase dashboard and click **"New project"**.
2.  Give your project a name and a strong database password.
3.  Wait for your new project to be provisioned.

## Step 2: Set Up the Database Schema

1.  Once your project is ready, navigate to the **SQL Editor** from the left sidebar.
2.  Click **"+ New query"**.
3.  Open the `supabase_schema.sql` file from this project, copy its entire content, and paste it into the Supabase SQL Editor.
4.  Click the **"RUN"** button.

This will create the `users` and `transactions` tables and set up the necessary Row Level Security (RLS) policies.

## Step 3: Connect the Application to Supabase

1.  In your Supabase project, go to **Project Settings** (the gear icon in the left sidebar).
2.  Click on the **API** tab.
3.  Find your **Project URL** and your **`anon` public key**.
4.  Open the `supabase_client.js` file in the project code.
5.  Replace the placeholder values for `supabaseUrl` and `supabaseKey` with the credentials you just copied.

    ```javascript
    // supabase_client.js
    const supabaseUrl = 'YOUR_SUPABASE_PROJECT_URL';
    const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

    window.supabase = supabase.createClient(supabaseUrl, supabaseKey);
    ```

## Step 4: Disable Email Confirmation (for local testing)

By default, Supabase requires users to verify their email address after signing up. For easier local testing, you can disable this.

1.  In your Supabase project, go to **Authentication** (the user icon in the left sidebar).
2.  Click on **Providers** and expand the **Email** provider.
3.  Turn **off** the "Confirm email" toggle.

## Step 5: Run the Application

Since the application is now purely frontend (HTML, CSS, JS), you just need a simple local server.

**Option A: Using VS Code Live Server**
1.  Install the "Live Server" extension in VS Code.
2.  Right-click on `index.html` and select "Open with Live Server".

**Option B: Using Python's built-in server**
1.  Open your terminal in the project's root directory.
2.  Run the command: `python -m http.server`
3.  Open your web browser and navigate to `http://localhost:8000`.

The application should now be running, connected to your Supabase backend. You can create an account and start managing your transactions.