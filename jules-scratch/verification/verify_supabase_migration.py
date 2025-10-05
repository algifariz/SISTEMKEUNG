import time
from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Generate a unique email for registration to avoid conflicts
    unique_email = f"testuser_{int(time.time())}@example.com"
    password = "password123"
    screenshot_path = "jules-scratch/verification/verification.png"

    try:
        # --- 1. Register a new user ---
        print("Navigating to register page...")
        page.goto("http://localhost:8000/register.html", timeout=60000)

        print(f"Registering with email: {unique_email}")
        page.get_by_placeholder("Enter your email").fill(unique_email)
        page.get_by_placeholder("Create a password").fill(password)
        page.get_by_role("button", name="Register").click()

        # Wait for the success notification first
        print("Waiting for success notification...")
        expect(page.locator("#notification-container")).to_contain_text("Registrasi berhasil", timeout=10000)

        # Then, wait for the redirection to the login page
        print("Waiting for redirection to login page after registration...")
        page.wait_for_url("http://localhost:8000/index.html", timeout=5000)
        print("Registration successful and redirected to login page.")

        # --- 2. Log in with the new user ---
        print("Logging in...")
        page.get_by_placeholder("Enter your email").fill(unique_email)
        page.get_by_placeholder("Enter your password").fill(password)
        page.get_by_role("button", name="Login").click()

        # Wait for redirection to the dashboard
        print("Waiting for redirection to dashboard...")
        expect(page).to_have_url("http://localhost:8000/dashboard.html", timeout=10000)
        print("Login successful and redirected to dashboard.")

        # --- 3. Add a new transaction ---
        print("Adding a new transaction...")
        # Click the "Transaksi" tab to show the form
        page.locator("#tab-transaksi").click()

        # Wait for the form to be visible
        expect(page.get_by_role("heading", name="Tambah Transaksi")).to_be_visible()

        # Fill the form
        page.get_by_label("Jumlah").fill("150000")
        page.get_by_label("Kategori").select_option("gaji")
        page.get_by_label("Keterangan").fill("Gaji pertama")

        # Submit the form
        page.get_by_role("button", name="Tambah Transaksi").click()

        # --- 4. Verify the transaction is displayed on the dashboard ---
        print("Verifying the new transaction on the dashboard...")
        # The app should automatically switch back to the dashboard tab.
        # We'll wait for the balance to update to confirm the data has loaded.
        expect(page.locator("#current-balance")).to_have_text("Rp 150.000", timeout=10000)

        # Check the recent transactions list for the new entry
        recent_transactions = page.locator("#recent-transactions")
        expect(recent_transactions).to_contain_text("Gaji")
        expect(recent_transactions).to_contain_text("+Rp 150.000")
        print("Transaction verified successfully.")

        # --- 5. Take a screenshot for visual confirmation ---
        print(f"Taking screenshot: {screenshot_path}")
        page.screenshot(path=screenshot_path)

        # --- 6. Logout ---
        print("Logging out...")
        page.get_by_role("button", name="Pengaturan").click()

        # Set up a listener to automatically accept the confirmation dialog
        page.on("dialog", lambda dialog: dialog.accept())

        # Click the logout button, which triggers the dialog
        page.get_by_role("button", name="Logout").click()

        # Wait for redirection back to the login page
        print("Waiting for redirection to login page after logout...")
        expect(page).to_have_url("http://localhost:8000/index.html", timeout=10000)
        print("Logout successful.")
        print("Verification script completed successfully!")

    except Exception as e:
        print(f"An error occurred during verification: {e}")
        # Take a screenshot on error for debugging
        page.screenshot(path="jules-scratch/verification/error.png")
        # Re-raise the exception to fail the script
        raise

    finally:
        # Clean up resources
        browser.close()

if __name__ == "__main__":
    with sync_playwright() as p:
        run_verification(p)