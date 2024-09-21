import com.microsoft.playwright.*;
import io.github.cdimascio.dotenv.Dotenv;
import org.junit.jupiter.api.*;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class LoginTest {
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
    }

    @AfterEach
    void closeContext() {
        context.close();
    }

    @Test
    void testSuccessfulLogin() {
        page.navigate(dotenv.get("BASE_URL"));
        page.click("#login-button");
        page.fill("#username", dotenv.get("USERNAME"));
        page.fill("#password", dotenv.get("PASSWORD"));
        page.click("#submit-login");

        assertThat(page).hasURL(dotenv.get("BASE_URL") + "/dashboard");
        assertThat(page.locator("#welcome-message")).containsText("Welcome, " + dotenv.get("USERNAME"));
    }

    @Test
    void testFailedLogin() {
        page.navigate(dotenv.get("BASE_URL"));
        page.click("#login-button");
        page.fill("#username", "invaliduser");
        page.fill("#password", "invalidpassword");
        page.click("#submit-login");

        assertThat(page.locator("#error-message")).isVisible();
        assertThat(page.locator("#error-message")).containsText("Invalid username or password");
    }
}