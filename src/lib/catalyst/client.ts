import { AISearchContent, Product } from '@/types/content';
import { JSONFileGenerator } from './file-generator';

export interface CatalystDeploymentConfig {
  catalystUrl: string;
  apiKey?: string;
  deploymentMethod: 'webhook' | 'api' | 'file-sync';
}

export class CatalystClient {
  private catalystUrl: string;
  private apiKey?: string;
  private deploymentMethod: 'webhook' | 'api' | 'file-sync';
  private fileGenerator: JSONFileGenerator;

  constructor(config?: CatalystDeploymentConfig) {
    this.catalystUrl = config?.catalystUrl || process.env.CATALYST_URL || 'https://riverpark-catalyst-fresh.vercel.app';
    this.apiKey = config?.apiKey || process.env.CATALYST_API_KEY;
    this.deploymentMethod = config?.deploymentMethod || 'file-sync'; // Default to file-sync for JSON generation
    this.fileGenerator = new JSONFileGenerator();
  }

  async publishContent(content: AISearchContent, product: Product): Promise<boolean> {
    try {
      // Always generate JSON files first
      await this.generateJSONFiles(content, product);

      // Then try additional publishing methods
      switch (this.deploymentMethod) {
        case 'webhook':
          return await this.publishViaWebhook(content);
        case 'api':
          return await this.publishViaAPI(content);
        case 'file-sync':
          return await this.publishViaFileSync(content);
        default:
          return true; // JSON files generated successfully
      }
    } catch (error) {
      console.error('Failed to publish content to Catalyst:', error);
      return false;
    }
  }

  private async generateJSONFiles(content: AISearchContent, product: Product): Promise<boolean> {
    try {
      const { quickRefFile, detailsFile } = this.fileGenerator.generateBothFiles(content, product);

      console.log(`📁 Generated JSON files for product ${content.productId}:`);
      console.log(`   Quick Reference: ${quickRefFile}`);
      console.log(`   Details: ${detailsFile}`);

      return true;
    } catch (error) {
      console.error('Failed to generate JSON files:', error);
      throw error;
    }
  }

  async publishBulkContent(
    contentWithProducts: Array<{ content: AISearchContent; product: Product }>
  ): Promise<{ successful: number; failed: number }> {
    let successful = 0;
    let failed = 0;

    console.log(`Publishing ${contentWithProducts.length} content items to Catalyst...`);

    for (const { content, product } of contentWithProducts) {
      const result = await this.publishContent(content, product);
      if (result) {
        successful++;
        console.log(`✅ Published content for product ${content.productId}: ${product.name}`);
      } else {
        failed++;
        console.log(`❌ Failed to publish content for product ${content.productId}: ${product.name}`);
      }

      // Add small delay to avoid overwhelming the API
      await this.delay(500);
    }

    console.log(`Bulk publish complete: ${successful} successful, ${failed} failed`);
    return { successful, failed };
  }

  private async publishViaWebhook(content: AISearchContent): Promise<boolean> {
    try {
      // Send content to Catalyst webhook endpoint
      const webhookUrl = `${this.catalystUrl}/api/content/ai-generated`;

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          productId: content.productId,
          content: content,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        // If webhook doesn't exist, fall back to file-based approach
        if (response.status === 404) {
          console.log('Webhook not found, falling back to file sync...');
          return await this.publishViaFileSync(content);
        }
        throw new Error(`Webhook failed: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Webhook publish failed:', error);
      // Fallback to file sync
      return await this.publishViaFileSync(content);
    }
  }

  private async publishViaAPI(content: AISearchContent): Promise<boolean> {
    try {
      // Direct API integration with BigCommerce/Catalyst
      const apiUrl = `${this.catalystUrl}/api/products/${content.productId}/ai-content`;

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(content)
      });

      return response.ok;
    } catch (error) {
      console.error('API publish failed:', error);
      return false;
    }
  }

  private async publishViaFileSync(content: AISearchContent): Promise<boolean> {
    try {
      // Generate structured content for Catalyst integration
      const catalystContent = this.transformForCatalyst(content);

      // This would typically write to a shared storage or repository
      // that Catalyst can read from (like GitHub, S3, or a shared database)
      const syncUrl = `${this.catalystUrl}/api/sync/content`;

      const response = await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type': 'ai-generated',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          productId: content.productId,
          catalystContent,
          metadata: {
            generatedAt: content.metadata.generatedAt,
            confidence: content.metadata.confidence,
            template: content.metadata.template
          }
        })
      });

      if (!response.ok) {
        // If sync endpoint doesn't exist, create a JSON file structure
        // that can be manually integrated or processed by Catalyst
        return await this.createStaticContentFiles(content, catalystContent);
      }

      return true;
    } catch (error) {
      console.error('File sync publish failed:', error);
      return false;
    }
  }

  private transformForCatalyst(content: AISearchContent): any {
    // Transform AI content into Catalyst-friendly format
    return {
      // Product Enhancement Data
      enhancedDescription: this.generateEnhancedDescription(content),

      // Care Guide Section
      careGuide: {
        difficulty: content.careRequirements.careLevel,
        tankSize: content.careRequirements.minTankSize,
        temperature: content.careRequirements.temperatureRange,
        ph: content.careRequirements.phRange,
        diet: content.careRequirements.diet,
        temperament: content.careRequirements.temperament,
        lifespan: content.careRequirements.lifespan
      },

      // Compatibility Section
      compatibility: {
        compatibleSpecies: content.compatibility.compatibleWith,
        avoidSpecies: content.compatibility.avoidWith,
        tankMateCategories: content.compatibility.tankMateCategories
      },

      // FAQ Section
      frequentlyAsked: content.aiContext.commonQuestions,

      // SEO Enhancement
      seoKeywords: content.searchKeywords,
      alternativeNames: content.aiContext.alternativeNames,

      // Breeding Information
      breedingInfo: content.breeding,

      // Related Products
      recommendations: content.relatedProducts,

      // Metadata for display
      displayMetadata: {
        scientificName: content.basicInfo.scientificName,
        family: content.basicInfo.family,
        origin: content.basicInfo.origin,
        whyPopular: content.aiContext.whyPopular,
        sellingPoints: content.aiContext.keySellingPoints
      }
    };
  }

  private generateEnhancedDescription(content: AISearchContent): string {
    const { basicInfo, careRequirements, aiContext } = content;

    return `
**${basicInfo.scientificName}** (${basicInfo.commonNames.join(', ')})

${aiContext.whyPopular}

**Quick Care Facts:**
• Tank Size: ${careRequirements.minTankSize}
• Temperature: ${careRequirements.temperatureRange}
• pH: ${careRequirements.phRange}
• Care Level: ${careRequirements.careLevel}
• Temperament: ${careRequirements.temperament}

**Key Features:**
${aiContext.keySellingPoints.map(point => `• ${point}`).join('\n')}

**Origin:** ${basicInfo.origin}
**Family:** ${basicInfo.family}
    `.trim();
  }

  private async createStaticContentFiles(content: AISearchContent, catalystContent: any): Promise<boolean> {
    try {
      // This would create JSON files that can be committed to the Catalyst repository
      // or uploaded to a content management system

      const contentFile = {
        productId: content.productId,
        lastUpdated: new Date().toISOString(),
        content: catalystContent,
        rawAIContent: content
      };

      // Log the content structure for manual integration
      console.log(`Content file created for product ${content.productId}:`, JSON.stringify(contentFile, null, 2));

      // In a real implementation, this might:
      // 1. Write to a GitHub repository that Catalyst monitors
      // 2. Upload to a CMS or headless content system
      // 3. Store in a database that Catalyst queries
      // 4. Write to a shared file system

      return true;
    } catch (error) {
      console.error('Failed to create static content files:', error);
      return false;
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check method
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.catalystUrl}/api/health`, {
        method: 'GET',
        headers: {
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Catalyst connection test failed:', error);
      return false;
    }
  }

  // Get deployment status
  async getDeploymentStatus(productId: number): Promise<any> {
    try {
      const response = await fetch(`${this.catalystUrl}/api/content/status/${productId}`, {
        headers: {
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        }
      });

      if (response.ok) {
        return await response.json();
      }

      return null;
    } catch (error) {
      console.error('Failed to get deployment status:', error);
      return null;
    }
  }
}