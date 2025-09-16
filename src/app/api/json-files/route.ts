import { NextRequest, NextResponse } from 'next/server';
import { BigCommerceClient } from '@/lib/bigcommerce/client';
import { AIContentGenerator } from '@/lib/ai/content-generator';
import { JSONFileGenerator } from '@/lib/catalyst/file-generator';

interface JSONFile {
  productId: number;
  productName: string;
  type: 'quickref' | 'details';
  filename: string;
  content: any;
  lastModified: string;
  size: number;
}

// In-memory storage for demo (replace with Supabase in production)
const jsonStorage: Map<string, any> = new Map();

function getStorageKey(productId: number, type: 'quickref' | 'details'): string {
  return `${productId}-${type}`;
}

export async function GET() {
  try {
    const files: JSONFile[] = [];

    // Get products to have names available
    const bigcommerce = new BigCommerceClient();
    const products = await bigcommerce.getAllProducts();
    const productMap = new Map(products.map(p => [p.productId, p.name]));

    // Convert storage to file list
    for (const [key, content] of jsonStorage.entries()) {
      const [productIdStr, type] = key.split('-');
      const productId = parseInt(productIdStr);
      const productName = productMap.get(productId) || `Product ${productId}`;

      const jsonString = JSON.stringify(content, null, 2);
      const file: JSONFile = {
        productId,
        productName,
        type: type as 'quickref' | 'details',
        filename: `${productId}-${type}.json`,
        content,
        lastModified: content.generatedAt || content.metadata?.generatedAt || new Date().toISOString(),
        size: Buffer.byteLength(jsonString, 'utf8')
      };

      files.push(file);
    }

    // Sort by product ID and type
    files.sort((a, b) => {
      if (a.productId !== b.productId) return a.productId - b.productId;
      return a.type.localeCompare(b.type);
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error fetching JSON files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch JSON files' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { productId, type, content } = await request.json();

    if (!productId || !type || !content) {
      return NextResponse.json(
        { error: 'Product ID, type, and content are required' },
        { status: 400 }
      );
    }

    if (!['quickref', 'details'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be either "quickref" or "details"' },
        { status: 400 }
      );
    }

    // Validate JSON structure based on type
    if (type === 'quickref') {
      if (!content.productId || !content.type || !content.quickReference) {
        return NextResponse.json(
          { error: 'QuickRef JSON must have productId, type, and quickReference fields' },
          { status: 400 }
        );
      }
    } else if (type === 'details') {
      if (!content.productId || !content.basicInfo || !content.careRequirements) {
        return NextResponse.json(
          { error: 'Details JSON must have productId, basicInfo, and careRequirements fields' },
          { status: 400 }
        );
      }
    }

    // Update timestamp
    if (type === 'quickref') {
      content.generatedAt = new Date().toISOString();
    } else {
      if (!content.metadata) content.metadata = {};
      content.metadata.generatedAt = new Date().toISOString();
    }

    // Store the updated content
    const key = getStorageKey(productId, type);
    jsonStorage.set(key, content);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating JSON file:', error);
    return NextResponse.json(
      { error: 'Failed to update JSON file' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { productId, type } = await request.json();

    if (!productId || !type) {
      return NextResponse.json(
        { error: 'Product ID and type are required' },
        { status: 400 }
      );
    }

    const key = getStorageKey(productId, type);
    const deleted = jsonStorage.delete(key);

    if (!deleted) {
      return NextResponse.json(
        { error: 'JSON file not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting JSON file:', error);
    return NextResponse.json(
      { error: 'Failed to delete JSON file' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { productId, regenerateType } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get product from BigCommerce
    const bigcommerce = new BigCommerceClient();
    const allProducts = await bigcommerce.getAllProducts();
    const product = allProducts.find(p => p.productId === parseInt(productId));

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Generate AI content
    const generator = new AIContentGenerator();
    const aiContent = await generator.generateContent(product, {
      family: 'community',
      behavior: 'community-friendly',
      templateType: 'community-standard',
      aiModel: 'gpt-4',
      validation: 'moderate'
    });

    // Generate JSON files
    const fileGenerator = new JSONFileGenerator();

    const results: { type: string; success: boolean }[] = [];

    if (!regenerateType || regenerateType === 'quickref') {
      try {
        fileGenerator.generateQuickRefJSON(aiContent, product);

        // Create quickref data for storage
        const quickrefData = {
          productId: aiContent.productId,
          type: "quickref",
          scientificName: aiContent.basicInfo.scientificName,
          commonName: aiContent.basicInfo.commonNames[0] || product.name,
          quickReference: [
            `Tank Size: ${aiContent.careRequirements.minTankSize}`,
            `Temperature: ${aiContent.careRequirements.temperatureRange}`,
            `pH: ${aiContent.careRequirements.phRange}`,
            `Care Level: ${aiContent.careRequirements.careLevel}`,
            `Temperament: ${aiContent.careRequirements.temperament}`,
            `Max Size: ${aiContent.careRequirements.maxSize}`,
            `Diet: ${aiContent.careRequirements.diet}`,
            `Lifespan: ${aiContent.careRequirements.lifespan}`,
            `Origin: ${aiContent.basicInfo.origin}`,
            `Family: ${aiContent.basicInfo.family}`
          ],
          generatedAt: aiContent.metadata.generatedAt,
          metadata: {
            fishFamily: aiContent.metadata.fishFamily,
            template: aiContent.metadata.template
          }
        };

        jsonStorage.set(getStorageKey(productId, 'quickref'), quickrefData);
        results.push({ type: 'quickref', success: true });
      } catch (error) {
        results.push({ type: 'quickref', success: false });
      }
    }

    if (!regenerateType || regenerateType === 'details') {
      try {
        fileGenerator.generateDetailsJSON(aiContent);
        jsonStorage.set(getStorageKey(productId, 'details'), aiContent);
        results.push({ type: 'details', success: true });
      } catch (error) {
        results.push({ type: 'details', success: false });
      }
    }

    return NextResponse.json({
      success: true,
      productId,
      productName: product.name,
      results
    });
  } catch (error) {
    console.error('Error regenerating JSON files:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate JSON files' },
      { status: 500 }
    );
  }
}

// Utility function to populate storage with existing generated content
export async function populateStorageFromGeneration(productId: number, aiContent: any, product: any) {
  try {
    const fileGenerator = new JSONFileGenerator();

    // Generate and store quickref JSON
    const quickrefData = {
      productId: aiContent.productId,
      type: "quickref",
      scientificName: aiContent.basicInfo.scientificName,
      commonName: aiContent.basicInfo.commonNames[0] || product.name,
      quickReference: [
        `Tank Size: ${aiContent.careRequirements.minTankSize}`,
        `Temperature: ${aiContent.careRequirements.temperatureRange}`,
        `pH: ${aiContent.careRequirements.phRange}`,
        `Care Level: ${aiContent.careRequirements.careLevel}`,
        `Temperament: ${aiContent.careRequirements.temperament}`,
        `Max Size: ${aiContent.careRequirements.maxSize}`,
        `Diet: ${aiContent.careRequirements.diet}`,
        `Lifespan: ${aiContent.careRequirements.lifespan}`,
        `Origin: ${aiContent.basicInfo.origin}`,
        `Family: ${aiContent.basicInfo.family}`
      ],
      generatedAt: aiContent.metadata.generatedAt,
      metadata: {
        fishFamily: aiContent.metadata.fishFamily,
        template: aiContent.metadata.template
      }
    };

    jsonStorage.set(getStorageKey(productId, 'quickref'), quickrefData);
    jsonStorage.set(getStorageKey(productId, 'details'), aiContent);

    console.log(`📁 Stored JSON files for product ${productId} in memory`);
  } catch (error) {
    console.error('Error populating storage:', error);
  }
}