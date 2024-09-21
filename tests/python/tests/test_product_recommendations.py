import pytest
from playwright.sync_api import Page, expect
from dotenv import load_dotenv
import os
import json
import random

load_dotenv()

@pytest.fixture(scope="module")
def user_data():
    return {
        "id": "test_user_123",
        "preferences": ["electronics", "books", "outdoor"],
        "purchase_history": ["laptop", "hiking boots", "sci-fi novel"]
    }

@pytest.fixture(autouse=True)
def setup_teardown(page: Page, user_data):
    # Setup: Login and set user data
    page.goto(f"{os.getenv('BASE_URL')}/login")
    page.fill("#username", os.getenv("USERNAME"))
    page.fill("#password", os.getenv("PASSWORD"))
    page.click("#login-button")
    page.evaluate(f"localStorage.setItem('userData', '{json.dumps(user_data)}')")
    
    yield
    
    # Teardown: Clear local storage and logout
    page.evaluate("localStorage.clear()")
    page.goto(f"{os.getenv('BASE_URL')}/logout")

def test_personalized_product_recommendations(page: Page, user_data):
    page.goto(f"{os.getenv('BASE_URL')}/recommendations")
    
    # Wait for recommendations to load
    page.wait_for_selector(".recommendation-item")
    
    # Check if recommendations are personalized
    recommendations = page.query_selector_all(".recommendation-item")
    assert len(recommendations) > 0, "No recommendations displayed"
    
    for item in recommendations:
        item_category = item.get_attribute("data-category")
        assert item_category in user_data["preferences"], f"Recommendation {item_category} not in user preferences"

def test_recommendation_refresh(page: Page):
    page.goto(f"{os.getenv('BASE_URL')}/recommendations")
    
    # Get initial recommendations
    initial_recommendations = page.query_selector_all(".recommendation-item")
    initial_ids = [item.get_attribute("data-id") for item in initial_recommendations]
    
    # Refresh recommendations
    page.click("#refresh-recommendations")
    page.wait_for_load_state("networkidle")
    
    # Get new recommendations
    new_recommendations = page.query_selector_all(".recommendation-item")
    new_ids = [item.get_attribute("data-id") for item in new_recommendations]
    
    # Check if at least some recommendations have changed
    assert initial_ids != new_ids, "Recommendations did not change after refresh"

def test_recommendation_interaction(page: Page):
    page.goto(f"{os.getenv('BASE_URL')}/recommendations")
    
    # Interact with a recommendation
    recommendations = page.query_selector_all(".recommendation-item")
    random_recommendation = random.choice(recommendations)
    recommendation_id = random_recommendation.get_attribute("data-id")
    
    random_recommendation.click()
    
    # Check if product page is loaded
    expect(page).to_have_url(f"{os.getenv('BASE_URL')}/product/{recommendation_id}")
    
    # Go back to recommendations
    page.go_back()
    
    # Check if interaction is recorded
    interacted_item = page.query_selector(f".recommendation-item[data-id='{recommendation_id}']")
    assert interacted_item.get_attribute("data-interacted") == "true", "Interaction not recorded"

def test_recommendation_api_fallback(page: Page):
    # Simulate API failure
    page.route("**/api/recommendations", lambda route: route.abort())
    
    page.goto(f"{os.getenv('BASE_URL')}/recommendations")
    
    # Check if fallback recommendations are displayed
    fallback_message = page.query_selector("#fallback-message")
    assert fallback_message.is_visible(), "Fallback message not displayed"
    
    fallback_recommendations = page.query_selector_all(".fallback-recommendation")
    assert len(fallback_recommendations) > 0, "No fallback recommendations displayed"