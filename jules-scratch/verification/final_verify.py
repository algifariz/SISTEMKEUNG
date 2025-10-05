import json
from playwright.sync_api import sync_playwright, Page, expect
import os

# --- Test Data ---
def create_sample_transactions():
    """Creates 12 sample transactions for testing."""
    transactions = []
    for i in range(12):
        transaction_type = "pemasukan" if i % 2 == 0 else "pengeluaran"
        amount = 100000 * (i + 1)
        # Dates are set to easily verify descending sort order
        date = f"2023-10-{12 - i:02d}"
        transactions.append({
            "id": i + 1,
            "type": transaction_type,
            "amount": amount,
            "category": "gaji" if transaction_type == "pemasukan" else "belanja",
            "date": date,
            "description": f"Test transaction {i + 1}"
        })
    return transactions

# --- Verification Script ---
def verify_all_features(page: Page):
    """
    This script provides a final, comprehensive verification for all requested features:
    1. Dashboard: Checks the 'Recent Transactions' list for the 5 most recent items and correct formatting.
    2. History Page: Verifies number formatting, filtering, and pagination are all fully functional.
    """
    # 1. Arrange: Navigate to the local index.html file.
    file_path = os.path.abspath('index.html')
    page.goto(f"file://{file_path}")

    # 2. Act: Inject transaction data and refresh the entire UI.
    sample_data = create_sample_transactions()
    page.evaluate(f"""
        window.transactions = {json.dumps(sample_data)};
        window.updateAllDisplays();
    """)

    # 3. Assert (Dashboard): Verify the "Recent Transactions" section.
    dashboard_recent_list = page.locator("#recent-transactions > div")

    # Check that exactly 5 items are displayed.
    expect(dashboard_recent_list).to_have_count(5)

    # Check the first item (most recent) for correct data and formatting.
    # The most recent transaction is id=1, amount=100,000, type=pemasukan.
    expect(dashboard_recent_list.first).to_contain_text("12 Okt 2023")
    expect(dashboard_recent_list.first).to_contain_text("+Rp 100.000")

    # 4. Act: Navigate to the "Riwayat" (History) tab.
    history_tab_button = page.get_by_role("button", name="Riwayat")
    history_tab_button.click()

    # 5. Assert (History Page): Check initial state.
    expect(page.locator("tbody > tr")).to_have_count(10)
    expect(page.locator("#pagination-controls")).to_contain_text("Menampilkan 1 sampai 10 dari 12 hasil")

    # 6. Act & Assert (History Page): Test filtering and searching.
    page.locator("#filter-type").select_option("pengeluaran")
    expect(page.locator("tbody > tr")).to_have_count(6) # Should now show 6 expenses
    expect(page.locator("#pagination-controls")).to_contain_text("Menampilkan 1 sampai 6 dari 6 hasil")

    page.get_by_placeholder("Cari transaksi...").fill("transaction 6")
    expect(page.locator("tbody > tr")).to_have_count(1) # Should show only one result
    expect(page.locator("tbody > tr").first).to_contain_text("-Rp 600.000")
    expect(page.locator("#pagination-controls")).to_contain_text("Menampilkan 1 sampai 1 dari 1 hasil")

    # 7. Screenshot: Capture the final, filtered state for visual verification.
    screenshot_path = "jules-scratch/verification/final_verification.png"
    page.screenshot(path=screenshot_path)
    print(f"Screenshot saved to {screenshot_path}")

# --- Main Execution ---
def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_all_features(page)
        finally:
            browser.close()

if __name__ == "__main__":
    main()