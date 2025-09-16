import { NextRequest, NextResponse } from 'next/server';
import { BigCommerceClient } from '@/lib/bigcommerce/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryIds = searchParams.get('categories')?.split(',').map(id => parseInt(id.trim()));

    const client = new BigCommerceClient();

    if (categoryIds && categoryIds.length > 0) {
      // Fetch ALL products for specific categories
      const allProducts = [];

      for (const categoryId of categoryIds) {
        if (!isNaN(categoryId)) {
          console.log(`Fetching all products for category ${categoryId}...`);
          const products = await client.getProductsByCategory(categoryId);
          allProducts.push(...products);
          console.log(`Found ${products.length} products in category ${categoryId}`);
        }
      }

      console.log(`Total products found: ${allProducts.length}`);
      return NextResponse.json(allProducts);
    } else {
      // Fetch ALL products from the store
      console.log('Fetching all products from BigCommerce...');
      const products = await client.getAllProducts();
      console.log(`Total products fetched: ${products.length}`);
      return NextResponse.json(products);
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}