import { chromium } from 'playwright';

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });

  page.on('pageerror', (err) => {
    console.log('PAGE ERROR:', err.message);
  });

  await page.goto('http://localhost:4200');
  await page.waitForTimeout(2000);

  // Screenshot dashboard
  await page.screenshot({ path: '/home/developer/workspace/screenshots/01-dashboard.png' });
  console.log('Dashboard screenshot saved');

  // Create a project
  await page.fill('input[placeholder="Project name"]', 'Test Project');
  await page.fill('input[placeholder="Description"]', 'A test project');
  await page.click('button:has-text("Create Project")');
  await page.waitForTimeout(500);

  await page.screenshot({ path: '/home/developer/workspace/screenshots/02-dashboard-with-project.png' });
  console.log('Dashboard with project screenshot saved');

  // Open project
  await page.click('a:has-text("Test Project")');
  await page.waitForTimeout(1500);

  await page.screenshot({ path: '/home/developer/workspace/screenshots/03-board.png' });
  console.log('Board screenshot saved');

  // Create a card
  await page.fill('input[placeholder="New card title"]', 'Test Card');
  await page.click('button:has-text("+ Card")');
  await page.waitForTimeout(500);

  await page.screenshot({ path: '/home/developer/workspace/screenshots/04-board-with-card.png' });
  console.log('Board with card screenshot saved');

  // Open card detail
  await page.click('text=Test Card');
  await page.waitForTimeout(1000);

  await page.screenshot({ path: '/home/developer/workspace/screenshots/05-card-detail.png' });
  console.log('Card detail screenshot saved');

  // Go to wiki
  await page.click('a:has-text("Wiki")');
  await page.waitForTimeout(1000);

  await page.screenshot({ path: '/home/developer/workspace/screenshots/06-wiki.png' });
  console.log('Wiki screenshot saved');

  // Create wiki page
  await page.fill('input[placeholder="Page title"]', 'Getting Started');
  await page.click('button:has-text("+ Page")');
  await page.waitForTimeout(500);

  await page.screenshot({ path: '/home/developer/workspace/screenshots/07-wiki-with-page.png' });
  console.log('Wiki with page screenshot saved');

  await browser.close();
  console.log('Verification complete');
}

verify().catch((err) => {
  console.error(err);
  process.exit(1);
});
