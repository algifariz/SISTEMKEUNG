# Setup Instructions for Money Tracker (XAMPP Version)

This guide will walk you through setting up the Money Tracker application to run on a local server using XAMPP.

## Prerequisites
- You need to have XAMPP installed on your computer. If you don't have it, download and install it from [here](https://www.apachefriends.org/index.html).

## Step 1: Place Project Files

1.  Navigate to your XAMPP installation directory.
2.  Find the `htdocs` folder. This is the web server's root directory.
3.  Place all the project files (`index.html`, `style.css`, `script.js`, `database.sql`, and the `api` folder) into a new folder inside `htdocs`. For example, you can create a folder named `money-tracker`.

    ```
    xampp/
    └── htdocs/
        └── money-tracker/
            ├── index.html
            ├── style.css
            ├── script.js
            ├── database.sql
            └── api/
                ├── config.php
                └── handler.php
    ```

## Step 2: Start Apache and MySQL

1.  Open the XAMPP Control Panel.
2.  Start the **Apache** module.
3.  Start the **MySQL** module.

Wait for both modules to turn green, indicating they are running correctly.

## Step 3: Create the Database

1.  In the XAMPP Control Panel, click the **Admin** button next to the MySQL module. This will open phpMyAdmin in your web browser.
2.  In phpMyAdmin, click on the **"New"** button in the left sidebar to create a new database.
3.  Enter `money_tracker` as the database name and click **"Create"**.
4.  Once the database is created, select it from the left sidebar.
5.  Click on the **"Import"** tab at the top.
6.  Click on **"Choose File"** and select the `database.sql` file from your project directory.
7.  Scroll down and click the **"Go"** button to start the import.

After a few moments, you should see a success message and a new `transactions` table in your `money_tracker` database.

## Step 4: Run the Application

1.  Open your web browser.
2.  Navigate to the following URL: `http://localhost/money-tracker/`

    *(Note: If you named your project folder something other than `money-tracker`, replace it in the URL accordingly.)*

The application should now be running, connected to your local MySQL database. You can start adding, viewing, and managing your transactions.