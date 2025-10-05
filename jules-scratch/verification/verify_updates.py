import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            # Navigate to the app
            await page.goto("http://localhost:8000", timeout=10000)

            # Go to settings and clear data
            await page.get_by_role("button", name="Pengaturan").click()

            # Handle the confirmation dialog for clearing data
            page.on("dialog", lambda dialog: dialog.accept())

            await page.get_by_role("button", name="Hapus Semua Data").click()

            # Wait for the success notification
            await expect(page.get_by_text("Semua data berhasil dihapus!")).to_be_visible()

            # Go to the transaction tab to add new transactions
            await page.get_by_role("button", name="Transaksi").click()

            # Add income transaction
            await page.get_by_role("button", name="Pemasukan").click()
            await page.locator("#transaction-amount").fill("500000")
            await page.locator("#transaction-category").select_option("gaji")
            await page.locator("#transaction-description").fill("Gaji Bulanan")
            await page.get_by_role("button", name="Tambah Transaksi").click()
            await expect(page.get_by_text("Transaksi berhasil ditambahkan!")).to_be_visible()

            # Add expense transaction
            await page.get_by_role("button", name="Transaksi").click() # re-navigate to ensure form is clear
            await page.get_by_role("button", name="Pengeluaran").click()
            await page.locator("#transaction-amount").fill("50000")
            await page.locator("#transaction-category").select_option("makanan")
            await page.locator("#transaction-description").fill("Makan siang")
            await page.get_by_role("button", name="Tambah Transaksi").click()
            await expect(page.get_by_text("Transaksi berhasil ditambahkan!")).to_be_visible()

            # Go to Riwayat (History) page
            await page.get_by_role("button", name="Riwayat").click()

            # Wait for table to be populated
            await expect(page.locator("#transactions-table").get_by_role("row")).to_have_count(3) # 2 data rows + 1 header row

            # --- VERIFY UPDATE ---
            # Find the row for "Gaji Bulanan" and click edit
            gaji_row = page.locator("tr", has_text="Gaji Bulanan")
            await gaji_row.get_by_role("button", name="Edit").click()

            # Edit the amount in the modal
            await expect(page.locator("#edit-modal")).to_be_visible()
            await page.locator("#edit-amount").fill("550000")
            await page.locator("#edit-description").fill("Gaji Bulanan (Revisi)")
            await page.get_by_role("button", name="Simpan").click()

            # Wait for the update success notification and for the modal to disappear
            await expect(page.get_by_text("Transaksi berhasil diperbarui!")).to_be_visible()
            await expect(page.locator("#edit-modal")).to_be_hidden()

            # Verify the table updated correctly
            await expect(page.locator("#transactions-table")).to_contain_text("Gaji Bulanan (Revisi)")
            await expect(page.locator("#transactions-table")).to_contain_text("Rp 550.000")


            # --- VERIFY DELETE ---
            # Find the row for "Makan siang" and click delete
            makan_row = page.locator("tr", has_text="Makan siang")

            # Handle the confirmation dialog for deleting data
            page.on("dialog", lambda dialog: dialog.accept())

            await makan_row.get_by_role("button", name="Hapus").click()

            # Wait for the delete success notification
            await expect(page.get_by_text("Transaksi berhasil dihapus!")).to_be_visible()

            # Verify the row is gone from the table
            await expect(page.locator("#transactions-table").get_by_role("row")).to_have_count(2) # 1 data row + 1 header row
            await expect(page.locator("tr", has_text="Makan siang")).to_be_hidden()

            # Take a screenshot
            await page.screenshot(path="jules-scratch/verification/verification.png")
            print("Screenshot saved to jules-scratch/verification/verification.png")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="jules-scratch/verification/error.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())