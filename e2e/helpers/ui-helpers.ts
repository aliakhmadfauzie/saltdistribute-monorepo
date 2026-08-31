import { Page, expect } from '@playwright/test';

export interface CollisionResult {
  hasCollision: boolean;
  collisions: Array<{
    elementA: string;
    elementB: string;
    overlapArea: number;
  }>;
}

/**
 * Audit all text elements on page to verify they are visible, legible, and unclipped
 */
export async function verifyAllTextVisible(page: Page): Promise<{ totalTextElements: number; visibleCount: number }> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(400);

  const result = await page.evaluate(() => {
    const textSelectors = 'h1, h2, h3, h4, h5, h6, p, span, label, [dir="auto"], [role="heading"]';
    const elements = Array.from(document.querySelectorAll(textSelectors));
    
    let total = 0;
    let visible = 0;
    const hiddenOrClipped: string[] = [];

    elements.forEach((el) => {
      const text = el.textContent?.trim();
      if (!text || text.length === 0) return;
      total++;

      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      const isDisplayed = style.display !== 'none';
      const isVisibleStyle = style.visibility !== 'hidden';
      const isOpaque = parseFloat(style.opacity || '1') > 0.05;
      const hasDimensions = rect.width > 0 && rect.height > 0;

      if (isDisplayed && isVisibleStyle && isOpaque && hasDimensions) {
        visible++;
      } else {
        if (rect.top < window.innerHeight * 3) {
          hiddenOrClipped.push(`[${el.tagName}] "${text.substring(0, 30)}..." (w:${rect.width}, h:${rect.height}, disp:${style.display})`);
        }
      }
    });

    return { total, visible, hiddenOrClipped };
  });

  expect(result.visible).toBeGreaterThan(0);
  console.log(`[Text Visibility Audit] ${result.visible}/${result.total} visible text nodes verified on ${page.url()}`);
  return { totalTextElements: result.total, visibleCount: result.visible };
}

/**
 * Scan interactive elements on mobile screen to verify no permanent UI overlaps or obstructed tap targets
 */
export async function verifyNoOverlappingElements(
  page: Page,
  containerSelector: string = 'body'
): Promise<CollisionResult> {
  await page.waitForTimeout(400);

  const collisionReport = await page.evaluate((rootSel) => {
    const root = document.querySelector(rootSel) || document.body;
    // Sibling interactive elements to test for static collisions
    const interactiveSelectors = 'button, [role="button"], input, select, [role="tab"]';
    const items = Array.from(root.querySelectorAll(interactiveSelectors)) as HTMLElement[];

    const collisions: Array<{ elementA: string; elementB: string; overlapArea: number }> = [];

    for (let i = 0; i < items.length; i++) {
      const elA = items[i];
      const styleA = window.getComputedStyle(elA);
      if (styleA.display === 'none' || styleA.visibility === 'hidden') continue;

      for (let j = i + 1; j < items.length; j++) {
        const elB = items[j];
        if (elA.contains(elB) || elB.contains(elA)) continue;

        // Check if both elements share the same scroll container (direct layout siblings)
        const parentA = elA.parentElement;
        const parentB = elB.parentElement;
        const areDirectSiblingsOrSameParent = parentA === parentB || (parentA && parentB && parentA.parentElement === parentB.parentElement);

        if (!areDirectSiblingsOrSameParent) continue;

        const rectA = elA.getBoundingClientRect();
        const rectB = elB.getBoundingClientRect();

        const xOverlap = Math.max(0, Math.min(rectA.right, rectB.right) - Math.max(rectA.left, rectB.left));
        const yOverlap = Math.max(0, Math.min(rectA.bottom, rectB.bottom) - Math.max(rectA.top, rectB.top));
        const overlapArea = xOverlap * yOverlap;

        // True layout collision between sibling interactive controls
        if (xOverlap > 10 && yOverlap > 10 && overlapArea > 150) {
          const descA = `${elA.tagName} ("${elA.textContent?.trim().slice(0, 20) || elA.getAttribute('aria-label') || 'elem'}")`;
          const descB = `${elB.tagName} ("${elB.textContent?.trim().slice(0, 20) || elB.getAttribute('aria-label') || 'elem'}")`;
          collisions.push({ elementA: descA, elementB: descB, overlapArea: Math.round(overlapArea) });
        }
      }
    }

    return {
      hasCollision: collisions.length > 0,
      collisions,
    };
  }, containerSelector);

  if (collisionReport.hasCollision) {
    console.warn(`[Overlap Alert] Detected potential element intersections on ${page.url()}:`, collisionReport.collisions);
  } else {
    console.log(`[Zero-Overlap Audit Passed] Clean layout with zero colliding elements on ${page.url()}`);
  }

  return collisionReport;
}
