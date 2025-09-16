import { NextRequest, NextResponse } from 'next/server';
import { CatalystClient } from '@/lib/catalyst/client';
import { BigCommerceClient } from '@/lib/bigcommerce/client';
import { AIContentGenerator } from '@/lib/ai/content-generator';

export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    console.log(`Testing Catalyst integration for product ${productId}...`);

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

    console.log(`Found product: ${product.name}`);

    // Generate AI content
    const generator = new AIContentGenerator();
    const aiContent = await generator.generateContent(product, {
      family: 'community',
      behavior: 'community-friendly',
      templateType: 'community-standard',
      aiModel: 'gpt-4',
      validation: 'moderate'
    });

    console.log(`Generated AI content for: ${product.name}`);

    // Test Catalyst connection
    const catalyst = new CatalystClient();
    const connectionTest = await catalyst.testConnection();

    console.log(`Catalyst connection test: ${connectionTest ? 'SUCCESS' : 'FAILED'}`);

    // Publish to Catalyst
    const publishResult = await catalyst.publishContent(aiContent, product);

    console.log(`Catalyst publish result: ${publishResult ? 'SUCCESS' : 'FAILED'}`);

    // Get deployment status
    const deploymentStatus = await catalyst.getDeploymentStatus(productId);

    return NextResponse.json({
      success: true,
      product: {
        id: product.productId,
        name: product.name
      },
      aiContent: {
        generated: true,
        confidence: aiContent.metadata.confidence,
        template: aiContent.metadata.template
      },
      catalyst: {
        connectionTest,
        publishResult,
        deploymentStatus,
        catalystUrl: 'https://riverpark-catalyst-fresh.vercel.app'
      },
      generatedContent: {
        enhancedDescription: aiContent.basicInfo,
        careGuide: aiContent.careRequirements,
        compatibility: aiContent.compatibility,
        faqs: aiContent.aiContext.commonQuestions
      }
    });

  } catch (error) {
    console.error('Catalyst test failed:', error);
    return NextResponse.json(
      {
        error: 'Catalyst integration test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Test basic Catalyst connection
    const catalyst = new CatalystClient();
    const connectionTest = await catalyst.testConnection();

    // Get sample product for testing
    const bigcommerce = new BigCommerceClient();
    const products = await bigcommerce.getAllProducts();
    const sampleProduct = products[0];

    return NextResponse.json({
      catalyst: {
        url: 'https://riverpark-catalyst-fresh.vercel.app',
        connectionTest,
        deploymentMethods: ['webhook', 'api', 'file-sync']
      },
      sampleProduct: sampleProduct ? {
        id: sampleProduct.productId,
        name: sampleProduct.name,
        categories: sampleProduct.categories
      } : null,
      instructions: {
        testSingleProduct: 'POST /api/catalyst/test with {"productId": 123}',
        integration: 'AI content will be generated and published to Catalyst automatically during job processing'
      }
    });

  } catch (error) {
    console.error('Catalyst info failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to get Catalyst information',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}