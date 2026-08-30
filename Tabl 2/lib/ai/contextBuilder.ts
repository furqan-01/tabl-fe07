import { MenuItem, DealOrPromotion, RestaurantInfo } from '@/types/restaurant';

/**
 * Formats the live Firestore restaurant context into structured, token-efficient Markdown.
 * Clearly emphasizes stock status, spice levels, dietary tags, allergens, pricing, and active promotions.
 */
export function buildRestaurantKnowledgeBase(
  menu: MenuItem[],
  deals: DealOrPromotion[],
  info: RestaurantInfo
): string {
  const currency = info.currency || 'Rs.';

  // Group menu by category
  const categories: Record<string, MenuItem[]> = {};
  menu.forEach((item) => {
    const cat = item.category || 'General';
    if (!categories[cat]) {
      categories[cat] = [];
    }
    categories[cat].push(item);
  });

  const spiceEmoji = (level: number) => {
    if (level <= 0) return 'Mild / No Spice (0/3)';
    if (level === 1) return '🌶️ Mild-Medium (1/3)';
    if (level === 2) return '🌶️🌶️ Medium-Hot (2/3)';
    return '🌶️🌶️🌶️ Very Hot (3/3)';
  };

  const sections: string[] = [];

  // 1. Restaurant Overview & Workflow
  sections.push(
    `# 🍽️ RESTAURANT OVERVIEW: ${info.name}\n` +
      `- **Opening Hours**: ${info.openingHours}\n` +
      `- **Address / Contact**: ${info.address || 'Dine-In Area'} | ${info.phone || 'N/A'}\n` +
      `- **Currency**: All prices are in ${currency}\n` +
      `- **Payment Policy**: ${info.tablePolicy}\n` +
      `- **Ordering Flow**: ${info.orderingWorkflow}`
  );

  // 2. Active Deals & Combos
  if (deals && deals.length > 0) {
    const dealsMd = deals
      .filter((d) => d.isActive)
      .map(
        (d) =>
          `### 🏷️ ${d.title}\n` +
          `- **Description**: ${d.description}\n` +
          (d.discountedPrice !== undefined ? `- **Special Price**: ${currency} ${d.discountedPrice}\n` : '') +
          (d.conditions ? `- **Terms/Hours**: ${d.conditions}\n` : '')
      )
      .join('\n');

    sections.push(`## 🎁 CURRENT ACTIVE DEALS & PROMOTIONS\n${dealsMd}`);
  }

  // 3. Live Menu by Category
  const menuSections: string[] = [];
  for (const [categoryName, items] of Object.entries(categories)) {
    const itemsMd = items
      .map((item) => {
        const stockStatus = item.isAvailable
          ? '✅ IN STOCK'
          : '❌ OUT OF STOCK (86-ed — DO NOT RECOMMEND OR ACCEPT FOR ORDERING)';

        const dietaryTags: string[] = [];
        if (item.isVegetarian) dietaryTags.push('🌱 Vegetarian');
        if (item.isVegan) dietaryTags.push('🌿 Vegan');
        if (item.isGlutenFree) dietaryTags.push('🌾 Gluten-Free');

        const allergensList =
          item.allergens && item.allergens.length > 0 ? item.allergens.join(', ') : 'None listed';
        const ingredientsList =
          item.ingredients && item.ingredients.length > 0 ? item.ingredients.join(', ') : 'N/A';

        return (
          `#### ${item.name} — ${currency} ${item.price}\n` +
          `- **Status**: ${stockStatus}\n` +
          `- **Category**: ${categoryName}\n` +
          `- **Description**: ${item.description}\n` +
          `- **Ingredients**: ${ingredientsList}\n` +
          `- **Allergens**: ${allergensList}\n` +
          `- **Dietary**: ${dietaryTags.length > 0 ? dietaryTags.join(' | ') : 'Standard'}\n` +
          `- **Spice Level**: ${spiceEmoji(item.spiceLevel)}`
        );
      })
      .join('\n\n');

    menuSections.push(`### 📂 Category: ${categoryName}\n${itemsMd}`);
  }

  sections.push(`## 📋 LIVE MENU CATALOG\n${menuSections.join('\n\n')}`);

  // 4. Critical Assistant Guidelines
  sections.push(
    `## ⚠️ CRITICAL OPERATIONAL RULES\n` +
      `1. **OUT OF STOCK ITEMS**: If an item is labeled ❌ OUT OF STOCK (such as items marked 86-ed), you MUST immediately inform the customer that it is unavailable today and recommend a closely related in-stock alternative.\n` +
      `2. **PAYMENT POLICY**: Remind guests who ask about billing or paying that they do NOT pay in the app. They place their order at the table, enjoy their meal, and pay their server/waiter directly upon concluding.\n` +
      `3. **PRICE ACCURACY**: Always quote exact prices in ${currency} matching the catalog above. Never invent prices or items not listed in this catalog.\n` +
      `4. **ALLERGEN & DIETARY SAFETY**: Always cross-check the allergen and dietary tags before recommending food for gluten-free, vegan, vegetarian, or allergen-sensitive guests.`
  );

  return sections.join('\n\n---\n\n');
}
