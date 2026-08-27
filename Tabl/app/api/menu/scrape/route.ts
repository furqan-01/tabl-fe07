import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { getAdminDb } from '@/lib/firebase/admin';
import { MenuItem } from '@/types/restaurant';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide a valid URL starting with http:// or https://',
        },
        { status: 400 }
      );
    }

    // Fetch the target webpage with realistic User-Agent and timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let html = '';
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 TablMenuScraper/1.0',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to fetch target URL. Server responded with status ${response.status}: ${response.statusText}`,
          },
          { status: 422 }
        );
      }

      html = await response.text();
    } finally {
      clearTimeout(timeoutId);
    }

    const $ = cheerio.load(html);
    const extractedItems: Array<Omit<MenuItem, 'id'>> = [];

    // Helper to parse price string from text (handles Rs., PKR, $, €, £, and digits)
    const parsePrice = (text: string): number => {
      if (!text) return 0;
      const match = text.match(/(?:Rs\.?|PKR|\$|€|£)?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i);
      if (match && match[1]) {
        return parseFloat(match[1].replace(',', ''));
      }
      return 0;
    };

    // Helper to categorize text
    const inferCategory = (name: string, desc: string): string => {
      const combined = `${name} ${desc}`.toLowerCase();
      if (combined.includes('burger') || combined.includes('pizza') || combined.includes('steak') || combined.includes('pasta') || combined.includes('main') || combined.includes('curry') || combined.includes('rice')) {
        return 'Mains';
      }
      if (combined.includes('wing') || combined.includes('bao') || combined.includes('salad') || combined.includes('roll') || combined.includes('soup') || combined.includes('starter') || combined.includes('appetizer')) {
        return 'Appetizers';
      }
      if (combined.includes('fries') || combined.includes('wedge') || combined.includes('bread') || combined.includes('dip') || combined.includes('side')) {
        return 'Sides';
      }
      if (combined.includes('tea') || combined.includes('coffee') || combined.includes('soda') || combined.includes('juice') || combined.includes('shake') || combined.includes('drink') || combined.includes('beverage')) {
        return 'Beverages';
      }
      if (combined.includes('cake') || combined.includes('ice cream') || combined.includes('dessert') || combined.includes('sweet') || combined.includes('lava') || combined.includes('brownie')) {
        return 'Desserts';
      }
      return 'Mains';
    };

    // Strategy 1: Targeted menu item card containers
    const candidateContainers = [
      '.menu-item',
      '.menu_item',
      '.food-item',
      '.dish-card',
      '.menu-card',
      '.item-card',
      '[data-menu-item]',
      'article.dish',
      'li.menu-entry',
    ];

    let foundSelector = '';
    for (const sel of candidateContainers) {
      if ($(sel).length > 0) {
        foundSelector = sel;
        break;
      }
    }

    if (foundSelector) {
      $(foundSelector).each((_, el) => {
        const itemEl = $(el);
        const name =
          itemEl.find('.name, .title, h3, h4, .item-name, .menu-title').first().text().trim() ||
          itemEl.find('strong').first().text().trim();
        const desc =
          itemEl.find('.desc, .description, p, .item-desc, .details').first().text().trim() || '';
        const priceText =
          itemEl.find('.price, .item-price, .cost, span.amount, .menu-price').first().text().trim() ||
          itemEl.text();

        const price = parsePrice(priceText);

        if (name && name.length > 2 && price > 0) {
          extractedItems.push({
            name,
            category: inferCategory(name, desc),
            price,
            description: desc,
            ingredients: [],
            allergens: [],
            isVegetarian: name.toLowerCase().includes('veg') || desc.toLowerCase().includes('vegetarian'),
            isVegan: desc.toLowerCase().includes('vegan'),
            isGlutenFree: desc.toLowerCase().includes('gluten-free'),
            spiceLevel: desc.toLowerCase().includes('spicy') || desc.toLowerCase().includes('hot') ? 2 : 0,
            isAvailable: true,
          });
        }
      });
    }

    // Strategy 2: Fallback to structured headings and list items if specific containers were absent
    if (extractedItems.length === 0) {
      $('li, tr, div').each((_, el) => {
        const text = $(el).clone().children().remove().end().text().trim() || $(el).text().trim();
        if (text.length > 5 && text.length < 120) {
          // Look for "Item Name ... Rs. 500" or "Burger - $12.50"
          const match = text.match(/^([A-Za-z0-9\s&'-]+?)(?:\s*[-–—:]|\s*\.{2,}|\s{2,})\s*(?:Rs\.?|PKR|\$|€|£)?\s*([0-9]+(?:\.[0-9]{1,2})?)$/i);
          if (match && match[1] && match[2]) {
            const rawName = match[1].trim();
            const rawPrice = parseFloat(match[2]);
            if (rawName.length > 2 && rawPrice > 0 && !extractedItems.some((e) => e.name === rawName)) {
              extractedItems.push({
                name: rawName,
                category: inferCategory(rawName, ''),
                price: rawPrice,
                description: '',
                ingredients: [],
                allergens: [],
                isVegetarian: false,
                isVegan: false,
                isGlutenFree: false,
                spiceLevel: 0,
                isAvailable: true,
              });
            }
          }
        }
      });
    }

    // Deduplicate extracted items by name
    const uniqueMap = new Map<string, Omit<MenuItem, 'id'>>();
    extractedItems.forEach((item) => {
      const key = item.name.toLowerCase();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });
    const finalItems = Array.from(uniqueMap.values()).slice(0, 50); // Cap to 50 items max

    const db = getAdminDb();
    let savedCount = 0;

    if (db && finalItems.length > 0) {
      const batch = db.batch();
      for (const item of finalItems) {
        const docRef = db.collection('menu').doc();
        batch.set(docRef, {
          ...item,
          scrapedFrom: url,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      await batch.commit();
      savedCount = finalItems.length;
    }

    return NextResponse.json({
      success: true,
      url,
      scrapedCount: finalItems.length,
      savedToFirestore: savedCount,
      items: finalItems,
      message:
        savedCount > 0
          ? `Successfully scraped ${finalItems.length} items and synced them to Firestore.`
          : `Extracted ${finalItems.length} items from HTML (Configure Firebase credentials for automatic database write).`,
    });
  } catch (error: any) {
    console.error('[API /api/menu/scrape POST] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Menu scraper encountered an unexpected error',
      },
      { status: 500 }
    );
  }
}
