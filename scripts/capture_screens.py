import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\AL_AAF\.gemini\antigravity-ide\brain\323ba005-21c9-4793-94f5-55f52ebf90fa"
BASE_URL = "http://localhost:3000"

async def capture_screens():
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        
        # 1. Mobile Portrait Device Viewport (412 x 915 - Android Material Standard)
        context_mobile = await browser.new_context(
            viewport={"width": 412, "height": 915},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True
        )
        
        page = await context_mobile.new_page()
        
        print("Capturing 1. Buyer Home Dashboard...")
        await page.goto(f"{BASE_URL}/", wait_until="networkidle")
        await page.wait_for_timeout(2500)
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "screen_buyer_dashboard_mobile.png"), full_page=True)
        
        print("Capturing 2. Buyer Orders & GPS Broadcast Screen...")
        # Navigate to orders
        orders_btn = page.locator('text=Orders').or_(page.locator('text=Pesanan')).or_(page.locator('[aria-label="My Orders"]'))
        if await orders_btn.count() > 0:
            await orders_btn.first.click()
            await page.wait_for_timeout(2000)
        else:
            await page.goto(f"{BASE_URL}/(buyer)/orders", wait_until="networkidle")
            await page.wait_for_timeout(2000)
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "screen_buyer_orders_mobile.png"), full_page=True)
        
        print("Capturing 3. Admin Executive Telemetry Dashboard...")
        await page.goto(f"{BASE_URL}/(admin)", wait_until="networkidle")
        await page.wait_for_timeout(3000)
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "screen_admin_dashboard_mobile.png"), full_page=True)
        
        print("Capturing 4. Admin Orders Pipeline & Live Radar...")
        await page.goto(f"{BASE_URL}/(admin)/orders", wait_until="networkidle")
        await page.wait_for_timeout(2500)
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "screen_admin_orders_mobile.png"), full_page=True)

        print("Capturing 5. Admin Inventory Controls...")
        await page.goto(f"{BASE_URL}/(admin)/inventory", wait_until="networkidle")
        await page.wait_for_timeout(2500)
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "screen_admin_inventory_mobile.png"), full_page=True)

        # 2. Desktop High-Resolution Viewport (1280 x 850)
        context_desktop = await browser.new_context(
            viewport={"width": 1280, "height": 850},
            device_scale_factor=1
        )
        page_desk = await context_desktop.new_page()
        
        print("Capturing 6. Admin Desktop Executive Dashboard...")
        await page_desk.goto(f"{BASE_URL}/(admin)", wait_until="networkidle")
        await page_desk.wait_for_timeout(3000)
        await page_desk.screenshot(path=os.path.join(ARTIFACT_DIR, "screen_admin_dashboard_desktop.png"), full_page=True)
        
        print("Capturing 7. Buyer Desktop Dashboard...")
        await page_desk.goto(f"{BASE_URL}/(buyer)", wait_until="networkidle")
        await page_desk.wait_for_timeout(2500)
        await page_desk.screenshot(path=os.path.join(ARTIFACT_DIR, "screen_buyer_dashboard_desktop.png"), full_page=True)

        await browser.close()
        print("All screen captures completed successfully!")

if __name__ == "__main__":
    asyncio.run(capture_screens())
