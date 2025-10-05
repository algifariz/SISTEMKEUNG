from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the application
        page.goto("http://localhost/money-tracker/", timeout=10000)

        # 1. Go to the "Tambah Transaksi" tab
        page.get_by_role("button", name="Tambah Transaksi").click()

        # 2. Fill out the form for a new income transaction
        # Ensure the 'pemasukan' (income) type is selected
        page.get_by_role("button", name="Pemasukan").click()

        # Fill in the details
        page.get_by_label("Jumlah").fill("500000")
        page.get_by_label("Kategori").select_option("gaji")
        page.get_by_label("Tanggal").fill("2025-10-04")
        page.get_by_label("Deskripsi").fill("Gaji Bulanan")

        # 3. Submit the form
        page.get_by_role("button", name="Simpan Transaksi").click()

        # 4. Wait for the dashboard to update
        # The app should switch to the dashboard and show a notification
        expect(page.get_by_text("Transaksi berhasil ditambahkan!")).to_be_visible()

        # Verify the balance is updated on the dashboard
        # Using a timeout to wait for the async update
        hero_balance = page.locator("#hero-balance")
        expect(hero_balance).to_have_text("Rp 500.000", timeout=5000)

        # 5. Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

        print("Verification script completed successfully and took a screenshot.")

    except Exception as e:
        print(f"An error occurred during verification: {e}")
        # Take a screenshot even on failure for debugging
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)