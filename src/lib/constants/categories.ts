// Storefront order. getCategories() emits one Category per name in this order
// (src/lib/v2/db.ts), so this array is what sorts the catalog slider and the
// course rows under it. Admin dropdowns follow it too.
export const CATEGORIES = [
  'AI ბიზნესისა და პროდუქტიულობისთვის', // ai-business
  'AI შემოქმედება და დიზაინი', // ai-creative
  'პროგრამირება AI-ით', // ai-coding
  'პრომპტ ინჟინერია', // prompt-engineering
  'AI ბავშვებისთვის', // ai-for-kids
  'ხელოვნური ინტელექტის საფუძვლები', // ai-foundations
  'AI მარკეტინგი', // ai-marketing
  'AI და კიბერუსაფრთხოება', // ai-security
  'AI აგენტები და ჩატბოტები', // ai-agents
] as const;

export type Category = (typeof CATEGORIES)[number];
