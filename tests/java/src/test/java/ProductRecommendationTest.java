import com.microsoft.playwright.*;
import io.github.cdimascio.dotenv.Dotenv;
import org.junit.jupiter.api.*;
import org.json.JSONObject;
import org.json.JSONArray;

import java.util.List;
import java.util.Random;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class ProductRecommendationTest {
    static Playwright playwright;
    static Browser browser;
    static Dotenv dotenv;
    BrowserContext context;
    Page page;
    JSONObject userData;

    @BeforeAll
    static void launchBrowser() {
        playwright = Playwright.create();
        browser = playwright.chromium().launch();
        dotenv = Dotenv.load();
    }

    @AfterAll
    static void closeBrowser() {
        playwright.close();
    }

    @BeforeEach
    void createContextAndPage() {
        context = browser.newContext();
        page = context.newPage();
        
        // Setup user data
        userData = new JSONObject();
        userData.put("id", "test_user_123");
        userData.put("preferences", new JSONArray(List.of("electronics", "books", "outdoor")));
        userData.put("purchase_history", new JSONArray(List.of("laptop", "hiking boots", "sci-fi novel")));
        
        // Login and set user data
        page.navigate(dotenv.get("BASE_URL") + "/login");
        page.fill("#username", dotenv.get("USERNAME"));
        page.fill("#password", dotenv.get("PASSWORD"));
        page.click("#login-button");
        page.evaluate("localStorage.setItem('userData', '" + userData.toString() + "')");
    }

    @AfterEach
    void closeContext() {
        page.evaluate("localStorage.clear()");
        page.navigate(dotenv.get("BASE_URL") + "/logout");
        context.close();
    }

    @Test
    void testPersonalizedProductRecommendations() {
        page.navigate(dotenv.get("BASE_URL") + "/recommendations");
        page.waitForSelector(".recommendation-item");
        
        ElementHandle[] recommendations = page.querySelectorAll(".recommendation-item").toArray(new ElementHandle[0]);
        Assertions.assertTrue(recommendations.length > 0, "No recommendations displayed");
        
        for (ElementHandle item : recommendations) {
            String itemCategory = item.getAttribute("data-category");
            Assertions.assertTrue(userData.getJSONArray("preferences").toList().contains(itemCategory),
                    "Recommendation " + itemCategory + " not in user preferences");
        }
    }

    @Test
    void testRecommendationRefresh() {
        page.navigate(dotenv.get("BASE_URL") + "/recommendations");
        
        ElementHandle[] initialRecommendations = page.querySelectorAll(".recommendation-item").toArray(new ElementHandle[0]);
        String[] initialIds = new String[initialRecommendations.length];
        for (int i = 0; i < initialRecommendations.length; i++) {
            initialIds[i] = initialRecommendations[i].getAttribute("data-id");
        }
        
        page.click("#refresh-recommendations");
        page.waitForLoadState(LoadState.NETWORKIDLE);
        
        ElementHandle[] newRecommendations = page.querySelectorAll(".recommendation-item").toArray(new ElementHandle[0]);
        String[] newIds = new String[newRecommendations.length];
        for (int i = 0; i < newRecommendations.length; i++) {
            newIds[i] = newRecommendations[i].getAttribute("data-id");
        }
        
        Assertions.assertFalse(java.util.Arrays.equals(initialIds, newIds), "Recommendations did not change after refresh");
    }

    @Test
    void testRecommendationInteraction() {
        page.navigate(dotenv.get("BASE_URL") + "/recommendations");
        
        ElementHandle[] recommendations = page.querySelectorAll(".recommendation-item").toArray(new ElementHandle[0]);
        ElementHandle randomRecommendation = recommendations[new Random().nextInt(recommendations.length)];
        String recommendationId = randomRecommendation.getAttribute("data-id");
        
        randomRecommendation.click();
        
        assertThat(page).hasURL(dotenv.get("BASE_URL") + "/product/" + recommendationId);
        
        page.goBack();
        
        ElementHandle interactedItem = page.querySelector(".recommendation-item[data-id='" + recommendationId + "']");
        Assertions.assertEquals("true", interactedItem.getAttribute("data-interacted"), "Interaction not recorded");
    }

    @Test
    void testRecommendationApiFallback() {
        page.route("**/api/recommendations", route -> route.abort());
        
        page.navigate(dotenv.get("BASE_URL") + "/recommendations");
        
        ElementHandle fallbackMessage = page.querySelector("#fallback-message");
        Assertions.assertTrue(fallbackMessage.isVisible(), "Fallback message not displayed");
        
        ElementHandle[] fallbackRecommendations = page.querySelectorAll(".fallback-recommendation").toArray(new ElementHandle[0]);
        Assertions.assertTrue(fallbackRecommendations.length > 0, "No fallback recommendations displayed");
    }
}