// You can replace this with a mock API (e.g. https://664c171935bbda10987eed26.mockapi.io/baitap)
const BASE_URL = 'https://69064c07ee3d0d14c13570c2.mockapi.io/baitap';

// Simple in-memory cache to avoid fetching the full list repeatedly from the mock API
let _cachedAll = null;
let _cachedAt = 0;
const CACHE_TTL = 60 * 1000; // 60s

async function fetchAllOnce() {
  try {
    const now = Date.now();
    if (_cachedAll && now - _cachedAt < CACHE_TTL) {
      // return cached copy
      return _cachedAll;
    }

    console.log('[MealAPI] fetching full list from mock API:', BASE_URL);
    const res = await fetch(BASE_URL);
    const all = await res.json();
    // Normalize possible envelopes. The mock API sometimes returns:
    // - an array of meal objects
    // - a single object { meals: [...] }
    // - an array containing one envelope [{ meals: [...] }]
    let items = [];
    if (Array.isArray(all)) {
      // If the array contains envelope objects (e.g. [{ meals: [...] }]), unwrap them
      if (all.length === 1 && all[0] && Array.isArray(all[0].meals)) {
        items = all[0].meals;
      } else if (all.every((it) => it && Array.isArray(it.meals))) {
        items = all.flatMap((it) => it.meals);
      } else {
        items = all;
      }
    } else if (all && Array.isArray(all.meals)) {
      items = all.meals;
    } else if (all && Array.isArray(all.data)) {
      items = all.data;
    } else {
      items = [];
    }
    _cachedAll = items;
    // extra debug: log how many items and a small sample
    try {
      console.log(
        `[MealAPI] fetched ${_cachedAll.length} items; sample keys:`,
        _cachedAll[0] ? Object.keys(_cachedAll[0]) : 'no-sample'
      );
    } catch (e) {
      console.warn('[MealAPI] could not log sample item', e);
    }
    _cachedAt = Date.now();
    return _cachedAll;
  } catch (err) {
    console.error('[MealAPI] fetchAllOnce error', err);
    return [];
  }
}

export const MealAPI = {
  // search meal by name
  searchMealsByName: async (query) => {
    try {
      // mock API doesn't support TheMealDB query endpoint; fetch all and filter locally
      if (BASE_URL.includes('mockapi.io')) {
        const all = await fetchAllOnce();
        return (all || []).filter(
          (m) =>
            m.strMeal && m.strMeal.toLowerCase().includes(query.toLowerCase())
        );
      }
      const response = await fetch(
        `${BASE_URL}/search.php?s=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error('Error searching meals by name:', error);
      return [];
    }
  },

  // lookup full meal details by id
  getMealById: async (id) => {
    try {
      if (BASE_URL.includes('mockapi.io')) {
        // mockapi stores resources under its own numeric ids, while the objects
        // include `idMeal` (TheMealDB id). The endpoint /baitap/<idMeal> may 404.
        // Use the cached full list helper to improve performance and reliability.
        const all = await fetchAllOnce();
        if (!all || all.length === 0) return null;
        const found = all.find(
          (m) => String(m.idMeal) === String(id) || String(m.id) === String(id)
        );
        return found || null;
      }
      const response = await fetch(`${BASE_URL}/lookup.php?i=${id}`);
      const data = await response.json();
      return data.meals ? data.meals[0] : null;
    } catch (error) {
      console.error('Error getting meal by id:', error);
      return null;
    }
  },

  // lookup a single random meal
  getRandomMeal: async () => {
    try {
      if (BASE_URL.includes('mockapi.io')) {
        const all = await fetchAllOnce();
        if (!all || all.length === 0) return null;
        return all[Math.floor(Math.random() * all.length)];
      }
      const response = await fetch(`${BASE_URL}/random.php`);
      const data = await response.json();
      return data.meals ? data.meals[0] : null;
    } catch (error) {
      console.error('Error getting random meal:', error);
      return null;
    }
  },

  // get multiple random meals
  getRandomMeals: async (count = 6) => {
    try {
      if (BASE_URL.includes('mockapi.io')) {
        const all = await fetchAllOnce();
        const shuffled = (all || []).sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
      }
      const promises = Array(count)
        .fill(undefined)
        .map(() => MealAPI.getRandomMeal());
      const meals = await Promise.all(promises);
      return meals.filter((meal) => meal !== null);
    } catch (error) {
      console.error('Error getting random meals:', error);
      return [];
    }
  },

  // list all meal categories
  getCategories: async () => {
    try {
      if (BASE_URL.includes('mockapi.io')) {
        const all = await fetchAllOnce();
        const map = {};
        (all || []).forEach((m) => {
          if (m.strCategory) map[m.strCategory] = m;
        });
        return Object.keys(map).map((k, i) => ({
          id: i + 1,
          strCategory: k,
          strCategoryThumb: map[k].strMealThumb,
          strCategoryDescription: '',
        }));
      }
      const response = await fetch(`${BASE_URL}/categories.php`);
      const data = await response.json();
      return data.categories || [];
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  },

  // filter by main ingredient
  filterByIngredient: async (ingredient) => {
    try {
      if (BASE_URL.includes('mockapi.io')) {
        const all = await fetchAllOnce();
        return (all || []).filter((m) => {
          for (let i = 1; i <= 20; i++) {
            const ing = m[`strIngredient${i}`];
            if (ing && ing.toLowerCase().includes(ingredient.toLowerCase()))
              return true;
          }
          return false;
        });
      }
      const response = await fetch(
        `${BASE_URL}/filter.php?i=${encodeURIComponent(ingredient)}`
      );
      const data = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error('Error filtering by ingredient:', error);
      return [];
    }
  },

  // filter by category
  filterByCategory: async (category) => {
    try {
      if (BASE_URL.includes('mockapi.io')) {
        const all = await fetchAllOnce();
        return (all || []).filter((m) => m.strCategory === category);
      }
      const response = await fetch(
        `${BASE_URL}/filter.php?c=${encodeURIComponent(category)}`
      );
      const data = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error('Error filtering by category:', error);
      return [];
    }
  },

  // transform TheMealDB meal data to our app format
  transformMealData: (meal) => {
    if (!meal) return null;

    // extract ingredients from the meal object
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        const measureText =
          measure && measure.trim() ? `${measure.trim()} ` : '';
        ingredients.push(`${measureText}${ingredient.trim()}`);
      }
    }

    // extract instructions
    const instructions = meal.strInstructions
      ? meal.strInstructions.split(/\r?\n/).filter((step) => step.trim())
      : [];

    // normalize image and id fields and warn if missing
    const imageUrl =
      meal?.strMealThumb ||
      meal?.strMealThumb ||
      meal?.image ||
      meal?.thumbnail ||
      null;
    if (!imageUrl || !meal?.strMeal) {
      // Log full meal object to debug unexpected shapes from the mock API
      console.warn(
        '[MealAPI] transformMealData: missing image or title for meal object:',
        meal
      );
    }

    return {
      id: meal.idMeal ?? meal.id,
      title: meal.strMeal,
      description: meal.strInstructions
        ? meal.strInstructions.substring(0, 120) + '...'
        : 'Delicious meal from TheMealDB',
      image: imageUrl,
      cookTime: '30 minutes',
      servings: 4,
      category: meal.strCategory || 'Main Course',
      area: meal.strArea,
      ingredients,
      instructions,
      originalData: meal,
    };
  },
};
