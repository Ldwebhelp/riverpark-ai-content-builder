import { Product, AISearchContent, ContentConfig, TemplateType } from '@/types/content';

export class AIContentGenerator {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
  }

  async generateContent(
    product: Product,
    config: ContentConfig
  ): Promise<AISearchContent> {
    // Simulate API call to OpenAI
    await this.delay(1000 + Math.random() * 2000); // 1-3 second delay

    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error('API timeout - failed to generate content');
    }

    const template = this.getTemplate(config.templateType);

    return {
      productId: product.productId,
      type: 'ai-search',
      version: '1.0',
      basicInfo: {
        scientificName: this.generateScientificName(product.name),
        commonNames: this.extractCommonNames(product.name),
        category: product.categories[0] || 'Freshwater Fish',
        family: this.determineFishFamily(product.name, config.family),
        origin: this.determineOrigin(product.name),
        waterType: 'Freshwater'
      },
      searchKeywords: this.generateKeywords(product.name),
      careRequirements: {
        minTankSize: this.determineTankSize(config.templateType),
        temperatureRange: this.determineTemperature(config.templateType),
        phRange: this.determinePH(config.templateType),
        maxSize: this.determineMaxSize(product.name),
        diet: this.determineDiet(config.templateType),
        careLevel: this.determineCareLevel(config.templateType),
        temperament: this.determineTemperament(config.templateType),
        socialNeeds: this.determineSocialNeeds(config.templateType),
        lifespan: this.determineLifespan(config.templateType)
      },
      compatibility: {
        compatibleWith: this.generateCompatibleSpecies(config.templateType),
        avoidWith: this.generateAvoidSpecies(config.templateType),
        tankMateCategories: this.generateTankMateCategories(config.templateType)
      },
      aiContext: {
        whyPopular: this.generatePopularityReason(product.name, config.templateType),
        keySellingPoints: this.generateSellingPoints(config.templateType),
        commonQuestions: this.generateQA(product.name, config.templateType),
        alternativeNames: this.generateAlternativeNames(product.name)
      },
      relatedProducts: {
        complementaryProducts: this.generateComplementaryProducts(config.templateType),
        similarSpecies: this.generateSimilarSpecies(product.name)
      },
      breeding: {
        breedingType: this.determineBreedingType(config.templateType),
        breedingDifficulty: this.determineBreedingDifficulty(config.templateType),
        breedingNotes: this.generateBreedingNotes(config.templateType)
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        confidence: this.calculateConfidence(product),
        sources: ['OpenAI GPT-4', 'Fish Database', 'Care Guides'],
        fishFamily: config.family,
        template: config.templateType
      }
    };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getTemplate(templateType: TemplateType): any {
    // Template configurations would be defined here
    const templates = {
      'cichlid-aggressive': {
        tankSize: '55+ gallons',
        temperament: 'Aggressive',
        socialNeeds: 'Species-only or with similar aggressive cichlids'
      },
      'cichlid-peaceful': {
        tankSize: '30+ gallons',
        temperament: 'Peaceful',
        socialNeeds: 'Community tank with peaceful cichlids'
      },
      'tetra-schooling': {
        tankSize: '20+ gallons',
        temperament: 'Peaceful',
        socialNeeds: 'School of 6+ individuals'
      },
      'livebearer-breeding': {
        tankSize: '20+ gallons',
        temperament: 'Peaceful',
        socialNeeds: 'Community tank, breeds readily'
      },
      'catfish-bottom': {
        tankSize: '30+ gallons',
        temperament: 'Peaceful',
        socialNeeds: 'Bottom-dwelling, good with most community fish'
      },
      'community-standard': {
        tankSize: '20+ gallons',
        temperament: 'Peaceful',
        socialNeeds: 'Community tank friendly'
      },
      'specialty-care': {
        tankSize: '40+ gallons',
        temperament: 'Variable',
        socialNeeds: 'Specific requirements, research needed'
      }
    };

    return templates[templateType];
  }

  private generateScientificName(productName: string): string {
    // Extract or generate scientific name
    const scientificPattern = /([A-Z][a-z]+ [a-z]+)/;
    const match = productName.match(scientificPattern);
    return match ? match[1] : `Genus species`;
  }

  private extractCommonNames(productName: string): string[] {
    // Extract common names from product name
    const names = [productName];

    // Add variations
    if (productName.includes('Cichlid')) {
      names.push(productName.replace('Cichlid', '').trim());
    }

    return names.slice(0, 3);
  }

  private determineFishFamily(productName: string, configFamily: string): string {
    // Logic to determine fish family based on name and config
    if (productName.toLowerCase().includes('cichlid')) return 'Cichlidae';
    if (productName.toLowerCase().includes('tetra')) return 'Characidae';
    if (productName.toLowerCase().includes('guppy') || productName.toLowerCase().includes('molly')) return 'Poeciliidae';
    if (productName.toLowerCase().includes('catfish') || productName.toLowerCase().includes('pleco')) return 'Loricariidae';

    return 'Cyprinidae'; // Default
  }

  private determineOrigin(productName: string): string {
    if (productName.toLowerCase().includes('malawi')) return 'Lake Malawi, Africa';
    if (productName.toLowerCase().includes('tanganyika')) return 'Lake Tanganyika, Africa';
    if (productName.toLowerCase().includes('victoria')) return 'Lake Victoria, Africa';
    if (productName.toLowerCase().includes('south american')) return 'South America';
    if (productName.toLowerCase().includes('asian')) return 'Southeast Asia';

    return 'Various freshwater habitats';
  }

  private generateKeywords(productName: string): string[] {
    const baseKeywords = [
      'freshwater fish',
      'aquarium fish',
      'tropical fish',
      productName.toLowerCase()
    ];

    // Add specific keywords based on product name
    if (productName.toLowerCase().includes('cichlid')) {
      baseKeywords.push('cichlid', 'african cichlid');
    }
    if (productName.toLowerCase().includes('tetra')) {
      baseKeywords.push('schooling fish', 'community fish');
    }

    return baseKeywords.slice(0, 8);
  }

  private determineTankSize(templateType: TemplateType): string {
    const template = this.getTemplate(templateType);
    return template.tankSize;
  }

  private determineTemperature(templateType: TemplateType): string {
    const tempRanges = {
      'cichlid-aggressive': '76-82°F (24-28°C)',
      'cichlid-peaceful': '74-80°F (23-27°C)',
      'tetra-schooling': '72-78°F (22-26°C)',
      'livebearer-breeding': '72-82°F (22-28°C)',
      'catfish-bottom': '72-78°F (22-26°C)',
      'community-standard': '72-78°F (22-26°C)',
      'specialty-care': 'Variable, species-specific'
    };

    return tempRanges[templateType];
  }

  private determinePH(templateType: TemplateType): string {
    const phRanges = {
      'cichlid-aggressive': '7.8-8.6',
      'cichlid-peaceful': '7.5-8.5',
      'tetra-schooling': '6.0-7.5',
      'livebearer-breeding': '7.0-8.5',
      'catfish-bottom': '6.5-7.5',
      'community-standard': '6.5-7.5',
      'specialty-care': 'Variable'
    };

    return phRanges[templateType];
  }

  private determineMaxSize(productName: string): string {
    // Estimate size based on fish type
    if (productName.toLowerCase().includes('dwarf')) return '2-3 inches';
    if (productName.toLowerCase().includes('large') || productName.toLowerCase().includes('giant')) return '8-12 inches';
    if (productName.toLowerCase().includes('tetra')) return '1-2 inches';
    if (productName.toLowerCase().includes('cichlid')) return '4-6 inches';

    return '3-5 inches';
  }

  private determineDiet(templateType: TemplateType): string {
    const diets = {
      'cichlid-aggressive': 'Omnivore - high-quality cichlid pellets, frozen foods',
      'cichlid-peaceful': 'Omnivore - cichlid pellets, vegetables, small live foods',
      'tetra-schooling': 'Omnivore - tropical flakes, micro pellets, frozen foods',
      'livebearer-breeding': 'Omnivore - tropical flakes, vegetables, live foods',
      'catfish-bottom': 'Omnivore - sinking pellets, algae wafers, frozen foods',
      'community-standard': 'Omnivore - tropical flakes, pellets',
      'specialty-care': 'Species-specific diet requirements'
    };

    return diets[templateType];
  }

  private determineCareLevel(templateType: TemplateType): string {
    const carelevels = {
      'cichlid-aggressive': 'Intermediate',
      'cichlid-peaceful': 'Beginner-Intermediate',
      'tetra-schooling': 'Beginner',
      'livebearer-breeding': 'Beginner',
      'catfish-bottom': 'Beginner',
      'community-standard': 'Beginner',
      'specialty-care': 'Advanced'
    };

    return carelevels[templateType];
  }

  private determineTemperament(templateType: TemplateType): string {
    const template = this.getTemplate(templateType);
    return template.temperament;
  }

  private determineSocialNeeds(templateType: TemplateType): string {
    const template = this.getTemplate(templateType);
    return template.socialNeeds;
  }

  private determineLifespan(templateType: TemplateType): string {
    const lifespans = {
      'cichlid-aggressive': '8-15 years',
      'cichlid-peaceful': '8-12 years',
      'tetra-schooling': '3-8 years',
      'livebearer-breeding': '2-5 years',
      'catfish-bottom': '10-15 years',
      'community-standard': '5-10 years',
      'specialty-care': 'Variable'
    };

    return lifespans[templateType];
  }

  private generateCompatibleSpecies(templateType: TemplateType): string[] {
    const compatibility = {
      'cichlid-aggressive': ['Other aggressive cichlids', 'Large catfish', 'Synodontis'],
      'cichlid-peaceful': ['Peaceful cichlids', 'Rainbow fish', 'Larger tetras'],
      'tetra-schooling': ['Other tetras', 'Corydoras', 'Peaceful cichlids', 'Livebearers'],
      'livebearer-breeding': ['Tetras', 'Corydoras', 'Peaceful cichlids', 'Other livebearers'],
      'catfish-bottom': ['Most community fish', 'Cichlids', 'Tetras'],
      'community-standard': ['Most peaceful community fish'],
      'specialty-care': ['Research species-specific compatibility']
    };

    return compatibility[templateType];
  }

  private generateAvoidSpecies(templateType: TemplateType): string[] {
    const avoid = {
      'cichlid-aggressive': ['Small peaceful fish', 'Delicate species'],
      'cichlid-peaceful': ['Aggressive cichlids', 'Very small fish'],
      'tetra-schooling': ['Large aggressive fish', 'Fish that will eat them'],
      'livebearer-breeding': ['Large predatory fish'],
      'catfish-bottom': ['Extremely aggressive fish'],
      'community-standard': ['Aggressive species'],
      'specialty-care': ['Incompatible species vary by fish']
    };

    return avoid[templateType];
  }

  private generateTankMateCategories(templateType: TemplateType): string[] {
    const categories = {
      'cichlid-aggressive': ['Aggressive cichlids', 'Large catfish'],
      'cichlid-peaceful': ['Peaceful cichlids', 'Medium community fish'],
      'tetra-schooling': ['Small community fish', 'Bottom dwellers', 'Peaceful fish'],
      'livebearer-breeding': ['Community fish', 'Peaceful species'],
      'catfish-bottom': ['Community fish', 'Most peaceful species'],
      'community-standard': ['Peaceful community fish'],
      'specialty-care': ['Species-specific']
    };

    return categories[templateType];
  }

  private generatePopularityReason(productName: string, templateType: TemplateType): string {
    const reasons = {
      'cichlid-aggressive': 'Popular for their vibrant colors and bold personalities in species-specific setups.',
      'cichlid-peaceful': 'Loved for their beautiful colors and relatively peaceful nature in community cichlid tanks.',
      'tetra-schooling': 'Favorite among beginners for their peaceful nature, schooling behavior, and easy care.',
      'livebearer-breeding': 'Popular for their ease of breeding, colorful varieties, and beginner-friendly care.',
      'catfish-bottom': 'Appreciated for their algae-eating abilities and peaceful bottom-dwelling nature.',
      'community-standard': 'Popular community fish known for their peaceful temperament and easy care.',
      'specialty-care': 'Sought after by advanced aquarists for their unique characteristics and care challenges.'
    };

    return reasons[templateType];
  }

  private generateSellingPoints(templateType: TemplateType): string[] {
    const points = {
      'cichlid-aggressive': ['Vibrant colors', 'Bold personality', 'Long-lived', 'Intelligent behavior'],
      'cichlid-peaceful': ['Beautiful coloration', 'Peaceful for cichlids', 'Hardy', 'Interesting behavior'],
      'tetra-schooling': ['Peaceful schooling', 'Beginner-friendly', 'Active swimmers', 'Community safe'],
      'livebearer-breeding': ['Easy breeding', 'Multiple color varieties', 'Hardy', 'Beginner-friendly'],
      'catfish-bottom': ['Algae control', 'Bottom cleaning', 'Peaceful nature', 'Hardy'],
      'community-standard': ['Peaceful temperament', 'Easy care', 'Community friendly', 'Attractive'],
      'specialty-care': ['Unique characteristics', 'Rare species', 'Advanced challenge', 'Distinctive']
    };

    return points[templateType];
  }

  private generateQA(productName: string, templateType: TemplateType): Array<{question: string, answer: string}> {
    return [
      {
        question: `What size tank do ${productName} need?`,
        answer: `${productName} require a minimum of ${this.determineTankSize(templateType)} with proper filtration and heating.`
      },
      {
        question: `Are ${productName} good for beginners?`,
        answer: `${productName} are considered ${this.determineCareLevel(templateType).toLowerCase()} level fish with ${this.determineTemperament(templateType).toLowerCase()} temperament.`
      },
      {
        question: `What do ${productName} eat?`,
        answer: this.determineDiet(templateType)
      }
    ];
  }

  private generateAlternativeNames(productName: string): string[] {
    return [productName, productName.replace(/\s+/g, ' ')];
  }

  private generateComplementaryProducts(templateType: TemplateType): string[] {
    return ['Aquarium heater', 'Filter media', 'Fish food', 'Water conditioner'];
  }

  private generateSimilarSpecies(productName: string): string[] {
    return [`Similar ${productName.split(' ')[0]} species`, 'Related varieties'];
  }

  private determineBreedingType(templateType: TemplateType): string {
    const types = {
      'cichlid-aggressive': 'Mouthbrooder',
      'cichlid-peaceful': 'Substrate spawner',
      'tetra-schooling': 'Egg scatterer',
      'livebearer-breeding': 'Livebearer',
      'catfish-bottom': 'Cave spawner',
      'community-standard': 'Various',
      'specialty-care': 'Species-specific'
    };

    return types[templateType];
  }

  private determineBreedingDifficulty(templateType: TemplateType): string {
    const difficulties = {
      'cichlid-aggressive': 'Moderate',
      'cichlid-peaceful': 'Moderate',
      'tetra-schooling': 'Moderate',
      'livebearer-breeding': 'Easy',
      'catfish-bottom': 'Difficult',
      'community-standard': 'Moderate',
      'specialty-care': 'Very Difficult'
    };

    return difficulties[templateType];
  }

  private generateBreedingNotes(templateType: TemplateType): string {
    const notes = {
      'cichlid-aggressive': 'Provide proper territory and breeding caves. Separate breeding pairs.',
      'cichlid-peaceful': 'Provide flat surfaces for spawning. Parents may guard eggs.',
      'tetra-schooling': 'Requires soft water and fine-leaved plants for egg laying.',
      'livebearer-breeding': 'Very easy to breed. Provide plants for fry protection.',
      'catfish-bottom': 'Requires caves and excellent water quality. Eggs are guarded.',
      'community-standard': 'Breeding varies by species. Research specific requirements.',
      'specialty-care': 'Complex breeding requirements. Research species-specific needs.'
    };

    return notes[templateType];
  }

  private calculateConfidence(product: Product): string {
    // Calculate confidence based on available data
    let score = 70; // Base score

    if (product.description && product.description.length > 50) score += 10;
    if (product.categories && product.categories.length > 0) score += 10;
    if (product.brand && product.brand.name) score += 5;
    if (product.defaultImage && product.defaultImage.url) score += 5;

    if (score >= 90) return 'high';
    if (score >= 80) return 'medium';
    return 'low';
  }
}