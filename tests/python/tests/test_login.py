import pytest
from playwright.sync_api import Page, expect
from dotenv import load_dotenv
import os

load_dotenv()

@pytest.fixture(scope="module", autouse=True)
def before_module():
    print("Setting up module...")
    yield
    print("Tearing down module...")

def test_successful_login(page: Page):
    page.goto("/")
    page.click("#login-button")
    page.fill("#username", os.getenv("USERNAME"))
    page.fill("#password", os.getenv("PASSWORD"))
    page.click("#submit-login")
    
    expect(page).to_have_url("/dashboard")
    expect(page.locator("#welcome-message")).to_contain_text(f"Welcome, {os.getenv('USERNAME')}")

def test_failed_login(page: Page):
    page.goto("/")
    page.click("#login-button")
    page.fill("#username", "invaliduser")
    page.fill("#password", "invalidpassword")
    page.click("#submit-login")
    
    expect(page.locator("#error-message")).to_be_visible()
    expect(page.locator("#error-message")).to_contain_text("Invalid username or password")