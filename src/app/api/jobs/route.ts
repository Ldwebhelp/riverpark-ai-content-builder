import { NextRequest, NextResponse } from 'next/server';
import { ProcessingJob, JobStatus } from '@/types/content';
import { v4 as uuidv4 } from 'uuid';
import { AIContentGenerator } from '@/lib/ai/content-generator';
import { CatalystClient } from '@/lib/catalyst/client';

// In-memory storage for demo (replace with Supabase in production)
const jobs: ProcessingJob[] = [];

export async function GET() {
  return NextResponse.json(jobs);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categories, batchSize, concurrent, config } = body;

    // Fetch real products from BigCommerce
    console.log('Fetching products for categories:', categories);

    let products = [];
    if (categories && categories.length > 0) {
      // Fetch products for specific categories
      const response = await fetch(`${request.nextUrl.origin}/api/products?categories=${categories.join(',')}`, {
        method: 'GET',
      });

      if (response.ok) {
        products = await response.json();
      } else {
        console.error('Failed to fetch products from API');
        throw new Error('Failed to fetch products');
      }
    } else {
      // Fetch all products if no categories specified
      const response = await fetch(`${request.nextUrl.origin}/api/products`, {
        method: 'GET',
      });

      if (response.ok) {
        products = await response.json();
      } else {
        console.error('Failed to fetch all products from API');
        throw new Error('Failed to fetch products');
      }
    }

    const totalProducts = products.length;
    console.log(`Found ${totalProducts} products for processing`);

    const newJob: ProcessingJob = {
      id: uuidv4(),
      categories,
      products: products, // Real products from BigCommerce
      config,
      batchSize,
      concurrent,
      status: 'pending' as JobStatus,
      progress: {
        total: totalProducts,
        completed: 0,
        failed: 0,
        percentage: 0
      },
      startedAt: new Date().toISOString(),
      errors: []
    };

    jobs.push(newJob);

    // Start processing simulation
    setTimeout(() => {
      simulateJobProgress(newJob.id);
    }, 1000);

    return NextResponse.json(newJob, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}

// Simulate job progress with real product data
async function simulateJobProgress(jobId: string) {
  const job = jobs.find(j => j.id === jobId);
  if (!job) return;

  job.status = 'running';
  console.log(`Starting job ${jobId} with ${job.products.length} products`);

  let processedProducts = 0;
  let currentProductIndex = 0;

  const interval = setInterval(async () => {
    const job = jobs.find(j => j.id === jobId);
    if (!job || job.status !== 'running') {
      clearInterval(interval);
      return;
    }

    // Process products one by one or in small batches
    const batchSize = Math.min(job.batchSize, job.products.length - currentProductIndex);
    if (batchSize <= 0) {
      // All products processed
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      console.log(`Job ${jobId} completed. Processed ${processedProducts} products.`);
      clearInterval(interval);
      return;
    }

    // Simulate processing a batch of products
    const processingBatch = job.products.slice(currentProductIndex, currentProductIndex + batchSize);
    let batchSuccessful = 0;
    let batchFailed = 0;

    // Process each product in the batch
    for (const product of processingBatch) {
      try {
        // Generate AI content
        const generator = new AIContentGenerator();
        const aiContent = await generator.generateContent(product, job.config);

        console.log(`✅ Generated AI content for: ${product.name}`);

        // Publish to Catalyst storefront
        const catalyst = new CatalystClient();
        const publishSuccess = await catalyst.publishContent(aiContent, product);

        // Store JSON files in memory for the JSON viewer
        const { populateStorageFromGeneration } = await import('../json-files/route');
        await populateStorageFromGeneration(product.productId, aiContent, product);

        if (publishSuccess) {
          batchSuccessful += 1;
          console.log(`🚀 Published to Catalyst: ${product.name}`);
        } else {
          batchFailed += 1;
          job.errors.push({
            productId: product.productId,
            productName: product.name,
            errorType: 'deployment',
            message: 'Failed to publish content to Catalyst storefront',
            timestamp: new Date().toISOString(),
            retryCount: 0,
            maxRetries: 3
          });
          console.log(`❌ Failed to publish to Catalyst: ${product.name}`);
        }
      } catch (error) {
        batchFailed += 1;
        job.errors.push({
          productId: product.productId,
          productName: product.name,
          errorType: 'ai-generation',
          message: error instanceof Error ? error.message : 'Failed to generate content',
          timestamp: new Date().toISOString(),
          retryCount: 0,
          maxRetries: 3
        });
        console.log(`❌ Failed to process product: ${product.name} - ${error}`);
      }
    }

    // Update progress
    processedProducts += batchSuccessful;
    currentProductIndex += batchSize;

    job.progress = {
      total: job.products.length,
      completed: processedProducts,
      failed: job.progress.failed + batchFailed,
      percentage: Math.round((processedProducts / job.products.length) * 100)
    };

    console.log(`Job ${jobId} progress: ${processedProducts}/${job.products.length} (${job.progress.percentage}%)`);

    // Complete job when done
    if (currentProductIndex >= job.products.length) {
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      console.log(`Job ${jobId} completed. Total: ${processedProducts} successful, ${job.progress.failed} failed.`);
      clearInterval(interval);
    }
  }, 3000); // Update every 3 seconds to simulate real processing time
}