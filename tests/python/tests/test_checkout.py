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

@pytest.fixture(autouse=True)
def before_each_after_each(page: Page):
    # Before each test
    page.goto("/")
    page.click("#login-button")
    page.fill("#username", os.getenv("USERNAME"))
    page.fill("#password", os.getenv("PASSWORD"))
    page.click("#submit-login")
    
    yield
    
    # After each test
    page.evaluate("localStorage.clear()")
    page.evaluate("sessionStorage.clear()")

def test_add_to_cart_and_checkout(page: Page):
    page.goto("/products")
    page.click("#add-to-cart-button")
    page.click("#cart-icon")
    page.click("#checkout-button")
    
    page.fill("#shipping-name", "John Doe")
    page.fill("#shipping-address", "123 Test St")
    page.fill("#shipping-city", "Test City")
    page.fill("#shipping-zip", "12345")
    page.click("#continue-button")
    
    page.click("#confirm-order-button")
    
    expect(page.locator("#order-confirmation")).to_be_visible()
    expect(page.locator("#order-confirmation")).to_contain_text("Thank you for your order!")

def test_empty_cart_checkout(page: Page):
    page.goto("/cart")
    expect(page.locator("#empty-cart-message")).to_be_visible()
    expect(page.locator("#checkout-button")).to_be_disabled()