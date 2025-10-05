from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Step 1: Register a new user
        print("Navigating to registration page...")
        page.goto("http://localhost:8080/register.html")
        expect(page).to_have_title("Register - MoneyTracker")

        print("Filling out registration form...")
        page.get_by_label("Username").fill("testuser")
        page.get_by_label("Password").fill("testpassword")
        page.get_by_role("button", name="Register").click()

        print("Expecting redirection to login page...")
        expect(page.get_by_text("Registrasi berhasil! Silakan login.")).to_be_visible()
        page.wait_for_url("**/index.html")
        expect(page).to_have_title("Login - MoneyTracker")
        print("Registration and redirection to login successful.")

        # Step 2: Log in with the new user
        print("Filling out login form...")
        page.get_by_label("Username").fill("testuser")
        page.get_by_label("Password").fill("testpassword")
        page.get_by_role("button", name="Login").click()

        print("Expecting redirection to dashboard...")
        expect(page.get_by_text("Login berhasil! Mengarahkan ke dashboard...")).to_be_visible()
        page.wait_for_url("**/dashboard.html")
        expect(page).to_have_title("MoneyTracker - Rekap Keuangan Keluarga")
        print("Login and redirection to dashboard successful.")

        # Step 3: Verify dashboard and take a screenshot
        print("Verifying dashboard content...")
        # Use a more specific locator to avoid strict mode violation
        expect(page.locator("#dashboard-content").get_by_text("Saldo Saat Ini")).to_be_visible()
        print("Taking dashboard screenshot...")
        page.screenshot(path="jules-scratch/verification/dashboard_view.png")

        # Step 4: Log out
        print("Navigating to settings and logging out...")
        page.get_by_role("button", name="Pengaturan").click()
        page.get_by_role("button", name="Logout").click()

        # Confirm the alert
        page.on("dialog", lambda dialog: dialog.accept())
        page.get_by_role("button", name="Logout").click()

        print("Expecting redirection to login page after logout...")
        expect(page.get_by_text("Anda telah keluar.")).to_be_visible()
        page.wait_for_url("**/index.html")
        print("Logout successful.")

        print("Taking final login page screenshot...")
        page.screenshot(path="jules-scratch/verification/final_login_view.png")

        print("Verification script completed successfully!")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error_screenshot.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)