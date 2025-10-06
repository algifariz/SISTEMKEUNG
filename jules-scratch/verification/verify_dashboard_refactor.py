import re
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Go to the login page
    page.goto("http://localhost:3000/")

    # Fill in the email and password
    page.get_by_placeholder("Enter your email").fill("user@example.com")
    page.get_by_placeholder("Enter your password").fill("password")

    # Click the login button
    page.get_by_role("button", name="Login").click()

    # Wait for navigation to the dashboard and for the header to be visible
    expect(page).to_have_url(re.compile(".*dashboard"))
    expect(page.get_by_role("heading", name="MoneyTracker")).to_be_visible()

    # Take a screenshot of the dashboard
    page.screenshot(path="jules-scratch/verification/dashboard_refactor.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)