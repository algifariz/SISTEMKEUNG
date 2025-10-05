from playwright.sync_api import sync_playwright, expect
import re

def add_transaction(page, type, amount, category, date, description=""):
    """Helper function to add a transaction."""
    # Use a more specific locator for the tab
    page.locator("#tab-transaksi").click()

    # Wait for the transaction tab to be visible
    expect(page.locator("#transaksi-content")).to_be_visible()

    # Set transaction type
    page.locator(f"#income-btn").click() if type == 'pemasukan' else page.locator(f"#expense-btn").click()

    # Fill out the form
    page.locator("#transaction-amount").fill(str(amount))
    page.locator("#transaction-date").fill(date)
    page.locator("#transaction-category").select_option(category)
    page.locator("#transaction-description").fill(description)

    # Submit
    page.get_by_role("button", name="Tambah Transaksi").click()

    # Wait for the notification
    expect(page.get_by_text("Transaksi berhasil ditambahkan!").last).to_be_visible()
    # Go back to dashboard
    page.locator("#tab-dashboard").click()
    # Wait for a specific element on the dashboard to be visible
    expect(page.locator("#current-balance")).to_be_visible()

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Go to the app
    page.goto("http://localhost:8000")

    # Clear any existing data for a clean test
    page.get_by_role("button", name="Pengaturan").click()
    page.once("dialog", lambda dialog: dialog.accept())
    page.get_by_role("button", name="Hapus Semua Data").click()
    expect(page.get_by_text("Semua data berhasil dihapus!")).to_be_visible()

    # --- SCENARIO: POSITIVE CHANGE ---

    # Add income for last month
    add_transaction(page, "pemasukan", 1000000, "gaji", "2025-09-15", "Gaji September")

    # Add income for this month
    add_transaction(page, "pemasukan", 1250000, "gaji", "2025-10-15", "Gaji Oktober")

    # Check the dashboard card
    percentage_element = page.locator("#current-balance + .text-xs")
    expect(percentage_element).to_have_class(re.compile(r"text-green-600"))
    expect(percentage_element).to_contain_text("+125.0% dari bulan lalu")

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/positive_change.png")

    # --- SCENARIO: NEGATIVE CHANGE ---

    # Clear data again
    page.get_by_role("button", name="Pengaturan").click()
    page.once("dialog", lambda dialog: dialog.accept())
    page.get_by_role("button", name="Hapus Semua Data").click()
    expect(page.get_by_text("Semua data berhasil dihapus!")).to_be_visible()

    # Add income for last month
    add_transaction(page, "pemasukan", 1000000, "gaji", "2025-09-15", "Gaji September")

    # Add an expense for this month
    add_transaction(page, "pengeluaran", 500000, "belanja", "2025-10-05", "Belanja Bulanan")

    # Check the dashboard card
    expect(percentage_element).to_have_class(re.compile(r"text-red-600"))
    expect(percentage_element).to_contain_text("-50.0% dari bulan lalu")

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/negative_change.png")

    browser.close()

    print("Verification script completed successfully.")