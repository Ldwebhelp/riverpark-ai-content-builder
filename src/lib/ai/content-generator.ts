import { Product, AISearchContent, ContentConfig } from '@/types/content';

export class AIContentGenerator {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
  }

  async generateContent(
    product: Product,
    config: ContentConfig
  ): Promise<AISearchContent> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required for content generation');
    }

    try {
      const prompt = this.buildPrompt(product, config);
      const response = await this.callOpenAI(prompt, config);
      const parsedContent = this.parseOpenAIResponse(response, product, config);

      return parsedContent;
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw new Error(`Failed to generate AI content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildPrompt(product: Product, config: ContentConfig): string {
    return `You are an expert aquarium specialist writing detailed care information for "${product.name}".

Product Details:
- Name: ${product.name}
- Categories: ${product.categories.join(', ')}
- Template: ${config.templateType}
- Fish Family: ${config.family}

Generate comprehensive aquarium care information in JSON format with the following structure:

{
  "basicInfo": {
    "scientificName": "Actual scientific name",
    "commonNames": ["Primary name", "Alternative names"],
    "family": "Actual fish family",
    "origin": "Natural habitat/geographic origin",
    "waterType": "Freshwater/Saltwater"
  },
  "careRequirements": {
    "minTankSize": "X gallons minimum",
    "temperatureRange": "XX-XX°F (XX-XX°C)",
    "phRange": "X.X-X.X",
    "maxSize": "X inches",
    "diet": "Detailed diet information",
    "careLevel": "Beginner/Intermediate/Advanced",
    "temperament": "Peaceful/Semi-aggressive/Aggressive",
    "socialNeeds": "Community details",
    "lifespan": "X-X years"
  },
  "compatibility": {
    "compatibleWith": ["List of compatible species"],
    "avoidWith": ["List of incompatible species"],
    "tankMateCategories": ["Community types"]
  },
  "aiContext": {
    "whyPopular": "Why this fish is popular with aquarists",
    "keySellingPoints": ["Unique features", "Benefits"],
    "commonQuestions": [
      {
        "question": "Relevant question",
        "answer": "Detailed answer"
      }
    ],
    "alternativeNames": ["Other names"],
    "expertTips": ["Professional care tips"]
  },
  "breeding": {
    "breedingDifficulty": "Easy/Moderate/Difficult",
    "breedingNotes": "Detailed breeding information",
    "sexingNotes": "How to identify males/females"
  }
}

Provide accurate, detailed information specific to this species. Do not use generic placeholders.`;
  }

  private async callOpenAI(prompt: string, config: ContentConfig): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.aiModel || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert aquarium specialist. Always respond with valid JSON only, no additional text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private parseOpenAIResponse(response: string, product: Product, config: ContentConfig): AISearchContent {
    try {
      // Clean the response to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in OpenAI response');
      }

      const parsedData = JSON.parse(jsonMatch[0]);

      // Construct the full AISearchContent object
      return {
        productId: product.productId,
        type: 'ai-search',
        version: '1.0',
        basicInfo: parsedData.basicInfo,
        searchKeywords: this.generateSearchKeywords(parsedData.basicInfo, product),
        careRequirements: parsedData.careRequirements,
        compatibility: parsedData.compatibility,
        aiContext: parsedData.aiContext,
        relatedProducts: {
          complementaryProducts: [],
          similarSpecies: []
        },
        breeding: parsedData.breeding,
        metadata: {
          generatedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          confidence: 'high',
          sources: ['OpenAI GPT-4o'],
          fishFamily: config.family,
          template: config.templateType
        }
      };
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      console.error('Raw response:', response);
      throw new Error('Failed to parse AI-generated content');
    }
  }

  private generateSearchKeywords(basicInfo: any, product: Product): string[] {
    const keywords = [
      product.name,
      basicInfo.scientificName,
      ...basicInfo.commonNames,
      basicInfo.family,
      'aquarium',
      'fish care',
      'freshwater'
    ];

    return [...new Set(keywords.filter(Boolean))];
  }

}