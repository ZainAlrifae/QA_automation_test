import com.microsoft.playwright.*;
import io.github.cdimascio.dotenv.Dotenv;
import org.junit.jupiter.api.*;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class CheckoutTest {
    static Playwright playwright;
    static Browser browser;
    static Dotenv dotenv;
    BrowserContext context;
    Page page;

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
        // Login before each test
        page.navigate(dotenv.get("BASE_URL"));
        page.click("#login-button");
        page.fill("#username", dotenv.get("USERNAME"));
        page.fill("#password", dotenv.get("PASSWORD"));
        page.click("#submit-login");
    }

    @AfterEach
    void closeContext() {
        context.close();
    }

    @Test
    void testAddToCartAndCheckout() {
        page.navigate(dotenv.get("BASE_URL") + "/products");
        page.click("#add-to-cart-button");
        page.click("#cart-icon");
        page.click("#checkout-button");

        page.fill("#shipping-name", "John Doe");
        page.fill("#shipping-address", "123 Test St");
        page.fill("#shipping-city", "Test City");
        page.fill("#shipping-zip", "12345");
        page.click("#continue-button");

        page.click("#confirm-order-button");

        assertThat(page.locator("#order-confirmation")).isVisible();
        assertThat(page.locator("#order-confirmation")).containsText("Thank you for your order!");
    }

    @Test
    void testEmptyCartCheckout() {
        page.navigate(dotenv.get("BASE_URL") + "/cart");
        assertThat(page.locator("#empty-cart-message")).isVisible();
        assertThat(page.locator("#checkout-button")).isDisabled();
    }
}