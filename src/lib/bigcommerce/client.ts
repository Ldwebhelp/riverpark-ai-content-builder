import { Product } from '@/types/content';

export class BigCommerceClient {
  private storeHash: string;
  private accessToken: string;
  private apiUrl: string;

  constructor(storeHash?: string, accessToken?: string) {
    this.storeHash = storeHash || process.env.BIGCOMMERCE_STORE_HASH || '';
    this.accessToken = accessToken || process.env.BIGCOMMERCE_ACCESS_TOKEN || '';
    this.apiUrl = `https://api.bigcommerce.com/stores/${this.storeHash}/v3`;
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    if (!this.storeHash || !this.accessToken) {
      console.warn('BigCommerce credentials not configured, using mock data');
      return this.generateMockProducts(`Category ${categoryId}`);
    }

    try {
      const allProducts: any[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(`${this.apiUrl}/catalog/products?categories:in=${categoryId}&include=images,categories&page=${page}&limit=250`, {
          headers: {
            'X-Auth-Token': this.accessToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`BigCommerce API error: ${response.status}`);
        }

        const data = await response.json();
        allProducts.push(...data.data);

        // Check if there are more pages
        hasMore = data.data.length === 250;
        page++;
      }

      return this.transformProducts(allProducts);
    } catch (error) {
      console.error('Failed to fetch products from BigCommerce:', error);
      // Fallback to mock data
      return this.generateMockProducts(`Category ${categoryId}`);
    }
  }

  async getCategories(): Promise<{ id: number; name: string; product_count: number }[]> {
    if (!this.storeHash || !this.accessToken) {
      console.warn('BigCommerce credentials not configured, using mock categories');
      return this.getMockCategories();
    }

    try {
      const allCategories: any[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(`${this.apiUrl}/catalog/categories?page=${page}&limit=250`, {
          headers: {
            'X-Auth-Token': this.accessToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`BigCommerce API error: ${response.status}`);
        }

        const data = await response.json();
        allCategories.push(...data.data);

        // Check if there are more pages
        hasMore = data.data.length === 250;
        page++;
      }

      return allCategories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        product_count: cat.product_count || 0
      }));
    } catch (error) {
      console.error('Failed to fetch categories from BigCommerce:', error);
      return this.getMockCategories();
    }
  }

  async getAllProducts(): Promise<Product[]> {
    if (!this.storeHash || !this.accessToken) {
      console.warn('BigCommerce credentials not configured, using mock data');
      const categories = await this.getCategories();
      const allProducts: Product[] = [];

      for (const category of categories) {
        const products = await this.getProductsByCategory(category.id);
        allProducts.push(...products);
      }

      return allProducts;
    }

    try {
      const allProducts: any[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(`${this.apiUrl}/catalog/products?include=images,categories&page=${page}&limit=250`, {
          headers: {
            'X-Auth-Token': this.accessToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`BigCommerce API error: ${response.status}`);
        }

        const data = await response.json();
        allProducts.push(...data.data);

        // Check if there are more pages
        hasMore = data.data.length === 250;
        page++;

        // Add some logging to track progress
        console.log(`Fetched page ${page - 1}, total products so far: ${allProducts.length}`);
      }

      console.log(`Finished fetching all products. Total: ${allProducts.length}`);
      return this.transformProducts(allProducts);
    } catch (error) {
      console.error('Failed to fetch all products from BigCommerce:', error);
      // Fallback to category-based approach
      const categories = await this.getCategories();
      const allProducts: Product[] = [];

      for (const category of categories) {
        const products = await this.getProductsByCategory(category.id);
        allProducts.push(...products);
      }

      return allProducts;
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private transformProducts(apiProducts: any[]): Product[] {
    return apiProducts.map(apiProduct => ({
      entityId: apiProduct.id,
      productId: apiProduct.id,
      name: apiProduct.name,
      price: parseFloat(apiProduct.price) || 0,
      categories: apiProduct.categories?.map((cat: any) => cat.name) || [],
      description: apiProduct.description || '',
      brand: {
        name: apiProduct.brand?.name || 'Unknown'
      },
      defaultImage: {
        url: apiProduct.images?.[0]?.url_standard || '',
        altText: apiProduct.images?.[0]?.description || apiProduct.name
      },
      path: apiProduct.custom_url?.url || `/products/${apiProduct.id}`
    }));
  }

  private getMockCategories(): { id: number; name: string; product_count: number }[] {
    return [
      { id: 1, name: 'Lake Malawi Cichlids', product_count: 64 },
      { id: 2, name: 'Livebearers', product_count: 60 },
      { id: 3, name: 'Central/South American', product_count: 53 },
      { id: 4, name: 'Tetras', product_count: 43 },
      { id: 5, name: 'Lake Tanganyika Cichlids', product_count: 35 },
      { id: 6, name: 'Catfish', product_count: 38 },
      { id: 7, name: 'Barbs', product_count: 29 },
      { id: 8, name: 'Danios', product_count: 25 },
      { id: 9, name: 'Gouramis', product_count: 31 },
      { id: 10, name: 'Loaches', product_count: 22 },
      { id: 11, name: 'Rainbowfish', product_count: 18 }
    ];
  }

  private generateMockProducts(categoryName: string): Product[] {
    const productCounts: Record<string, number> = {
      'Lake Malawi Cichlids': 64,
      'Livebearers': 60,
      'Central/South American': 53,
      'Tetras': 43,
      'Lake Tanganyika Cichlids': 35,
      'Catfish': 38,
      'Barbs': 29,
      'Danios': 25,
      'Gouramis': 31,
      'Loaches': 22,
      'Rainbowfish': 18
    };

    const count = productCounts[categoryName] || 15;
    const products: Product[] = [];

    const sampleNames = this.getSampleNames(categoryName);

    for (let i = 0; i < count; i++) {
      const baseName = sampleNames[i % sampleNames.length];
      const productId = 1000 + i + Math.floor(Math.random() * 1000);

      products.push({
        entityId: productId,
        productId,
        name: `${baseName} ${i > sampleNames.length ? `(Variety ${i - sampleNames.length + 1})` : ''}`.trim(),
        price: Math.floor(Math.random() * 50) + 10,
        categories: [categoryName],
        description: `Beautiful ${baseName.toLowerCase()} perfect for aquarium enthusiasts. Hardy and colorful fish suitable for appropriate tank setups.`,
        brand: {
          name: this.getRandomBrand()
        },
        defaultImage: {
          url: 'https://example.com/fish-image.jpg',
          altText: `${baseName} aquarium fish`
        },
        path: `/products/${baseName.toLowerCase().replace(/\s+/g, '-')}-${productId}`
      });
    }

    return products;
  }

  private getSampleNames(categoryName: string): string[] {
    const namesByCategory: Record<string, string[]> = {
      'Lake Malawi Cichlids': [
        'Aulonocara Blue Peacock',
        'Labidochromis Yellow',
        'Pseudotropheus Zebra',
        'Aulonocara Firefish',
        'Melanochromis Johannii',
        'Protomelas Taeniolatus',
        'Sciaenochromis Fryeri',
        'Copadichromis Borleyi'
      ],
      'Livebearers': [
        'Fancy Guppy',
        'Mollies Black',
        'Platy Red',
        'Endlers Livebearer',
        'Swordtail Green',
        'Balloon Molly',
        'Mickey Mouse Platy',
        'Blue Moscow Guppy'
      ],
      'Central/South American': [
        'German Blue Ram',
        'Electric Blue Acara',
        'Bolivian Ram',
        'Firemouth Cichlid',
        'Convict Cichlid',
        'Jack Dempsey',
        'Green Terror',
        'Oscar Tiger'
      ],
      'Tetras': [
        'Neon Tetra',
        'Cardinal Tetra',
        'Black Skirt Tetra',
        'Serpae Tetra',
        'Congo Tetra',
        'Rummy Nose Tetra',
        'Ember Tetra',
        'Diamond Tetra'
      ],
      'Lake Tanganyika Cichlids': [
        'Frontosa Cichlid',
        'Calvus Cichlid',
        'Leleupi Cichlid',
        'Brichardi Cichlid',
        'Multifasciatus Cichlid',
        'Compressiceps Cichlid'
      ],
      'Catfish': [
        'Corydoras Panda',
        'Bristlenose Pleco',
        'Otocinclus Catfish',
        'Synodontis Catfish',
        'Pictus Catfish',
        'Banjo Catfish',
        'Royal Pleco',
        'Zebra Pleco'
      ],
      'Barbs': [
        'Tiger Barb',
        'Cherry Barb',
        'Rosy Barb',
        'Gold Barb',
        'Denison Barb',
        'Odessa Barb'
      ],
      'Danios': [
        'Zebra Danio',
        'Giant Danio',
        'Pearl Danio',
        'Leopard Danio',
        'Celestial Pearl Danio'
      ],
      'Gouramis': [
        'Dwarf Gourami',
        'Pearl Gourami',
        'Blue Gourami',
        'Honey Gourami',
        'Kissing Gourami',
        'Paradise Fish'
      ],
      'Loaches': [
        'Clown Loach',
        'Yoyo Loach',
        'Kuhli Loach',
        'Zebra Loach',
        'Weather Loach'
      ],
      'Rainbowfish': [
        'Boesemani Rainbow',
        'Turquoise Rainbow',
        'Red Rainbow',
        'Australian Rainbow',
        'Madagascar Rainbow'
      ]
    };

    return namesByCategory[categoryName] || ['Generic Fish'];
  }

  private getRandomBrand(): string {
    const brands = [
      'AquaLife',
      'TropicalFish Co.',
      'FreshWater Specialists',
      'Aquarium Direct',
      'Fish Paradise',
      'AquaWorld'
    ];

    return brands[Math.floor(Math.random() * brands.length)];
  }
}