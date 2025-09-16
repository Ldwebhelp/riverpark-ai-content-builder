import { AISearchContent, Product, SpeciesContent } from '@/types/content';

export class JSONFileGenerator {
  private outputDir: string;

  constructor(outputDir = './output/json-files') {
    this.outputDir = outputDir;
    this.ensureOutputDirectory();
  }

  private ensureOutputDirectory(): void {
    // For API routes, we'll log the JSON structure instead of writing files
    console.log(`📁 Output directory configured: ${this.outputDir}`);
  }

  /**
   * Generate [productId]-species.json file
   */
  generateSpeciesJSON(content: AISearchContent, product: Product): string {
    const speciesData = {
      productId: content.productId,
      type: "species",
      scientificName: content.basicInfo.scientificName,
      commonName: content.basicInfo.commonNames[0] || product.name,
      quickReference: [
        `Tank Size: ${content.careRequirements.minTankSize}`,
        `Temperature: ${content.careRequirements.temperatureRange}`,
        `pH: ${content.careRequirements.phRange}`,
        `Care Level: ${content.careRequirements.careLevel}`,
        `Temperament: ${content.careRequirements.temperament}`,
        `Max Size: ${content.careRequirements.maxSize}`,
        `Diet: ${content.careRequirements.diet}`,
        `Lifespan: ${content.careRequirements.lifespan}`,
        `Origin: ${content.basicInfo.origin}`,
        `Family: ${content.basicInfo.family}`
      ],
      generatedAt: content.metadata.generatedAt,
      metadata: {
        fishFamily: content.metadata.fishFamily,
        template: content.metadata.template
      }
    };

    const filename = `${content.productId}-species.json`;
    const filepath = `${this.outputDir}/${filename}`;

    // Log the JSON structure for demonstration
    console.log(`\n📄 Generated ${filename}:`);
    console.log(JSON.stringify(speciesData, null, 2));

    // In a real implementation, this would write to file system or upload to storage
    console.log(`✅ Species file structure ready: ${filename}`);
    return filepath;
  }

  /**
   * Generate [productId]-ai-search.json file
   */
  generateAISearchJSON(content: AISearchContent): string {
    // Use the complete AISearchContent structure as defined in types
    const aiSearchData: AISearchContent = {
      productId: content.productId,
      type: content.type,
      version: content.version,
      basicInfo: content.basicInfo,
      searchKeywords: content.searchKeywords,
      careRequirements: content.careRequirements,
      compatibility: content.compatibility,
      aiContext: content.aiContext,
      relatedProducts: content.relatedProducts,
      breeding: content.breeding,
      metadata: content.metadata
    };

    const filename = `${content.productId}-ai-search.json`;
    const filepath = `${this.outputDir}/${filename}`;

    // Log the JSON structure for demonstration
    console.log(`\n📄 Generated ${filename}:`);
    console.log(JSON.stringify(aiSearchData, null, 2));

    // In a real implementation, this would write to file system or upload to storage
    console.log(`✅ AI search file structure ready: ${filename}`);
    return filepath;
  }

  /**
   * Generate both files for a product
   */
  generateBothFiles(content: AISearchContent, product: Product): {
    speciesFile: string;
    aiSearchFile: string;
  } {
    const speciesFile = this.generateSpeciesJSON(content, product);
    const aiSearchFile = this.generateAISearchJSON(content);

    return { speciesFile, aiSearchFile };
  }

  /**
   * Bulk generate files for multiple products
   */
  async generateBulkFiles(
    contentList: { content: AISearchContent; product: Product }[]
  ): Promise<{
    successful: number;
    failed: number;
    files: string[];
  }> {
    let successful = 0;
    let failed = 0;
    const files: string[] = [];

    console.log(`🚀 Starting bulk JSON file generation for ${contentList.length} products...`);

    for (const { content, product } of contentList) {
      try {
        const { speciesFile, aiSearchFile } = this.generateBothFiles(content, product);
        files.push(speciesFile, aiSearchFile);
        successful++;

        console.log(`✅ Generated files for product ${content.productId}: ${product.name}`);
      } catch (error) {
        failed++;
        console.error(`❌ Failed to generate files for product ${content.productId}: ${error}`);
      }
    }

    console.log(`📁 Bulk generation complete: ${successful} successful, ${failed} failed`);
    console.log(`📂 Files saved to: ${this.outputDir}`);

    return { successful, failed, files };
  }

  /**
   * Get output directory path
   */
  getOutputDirectory(): string {
    return this.outputDir;
  }

  /**
   * List all generated files
   */
  listGeneratedFiles(): string[] {
    // In API context, return simulated file list
    console.log('📋 Generated files would be listed here in a file system implementation');
    return [];
  }

  /**
   * Clean output directory
   */
  cleanOutputDirectory(): void {
    console.log(`🧹 Output directory would be cleaned: ${this.outputDir}`);
  }

  /**
   * Get file statistics
   */
  getFileStats(): {
    totalFiles: number;
    speciesFiles: number;
    aiSearchFiles: number;
    outputDirectory: string;
  } {
    const files = this.listGeneratedFiles();
    const speciesFiles = files.filter(f => f.includes('-species.json')).length;
    const aiSearchFiles = files.filter(f => f.includes('-ai-search.json')).length;

    return {
      totalFiles: files.length,
      speciesFiles,
      aiSearchFiles,
      outputDirectory: this.outputDir
    };
  }
}