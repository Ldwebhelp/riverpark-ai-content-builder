/**
 * Core TypeScript definitions for Riverpark AI Content Builder
 */

// Base product information from BigCommerce
export interface Product {
  entityId: number;
  productId: number;
  name: string;
  price: number;
  categories: string[];
  description: string;
  brand: {
    name: string;
  };
  defaultImage: {
    url: string;
    altText: string;
  };
  path: string;
}

// Fish family classifications
export type FishFamily =
  | 'cichlids'
  | 'tetras'
  | 'livebearers'
  | 'catfish'
  | 'barbs'
  | 'danios'
  | 'gouramis'
  | 'loaches'
  | 'rainbowfish'
  | 'community'
  | 'specialty';

// Fish behavior types for template selection
export type FishBehavior =
  | 'peaceful-schooling'
  | 'territorial-aggressive'
  | 'semi-aggressive'
  | 'bottom-dwelling'
  | 'surface-dwelling'
  | 'community-friendly';

// Content generation configuration
export interface ContentConfig {
  family: FishFamily;
  behavior: FishBehavior;
  templateType: TemplateType;
  aiModel: 'gpt-4o' | 'gpt-4' | 'gpt-4-turbo';
  validation: 'strict' | 'moderate' | 'lenient';
}

// Template types for different fish families
export type TemplateType =
  | 'cichlid-aggressive'
  | 'cichlid-peaceful'
  | 'tetra-schooling'
  | 'livebearer-breeding'
  | 'catfish-bottom'
  | 'community-standard'
  | 'specialty-care';

// Generated AI search content structure
export interface AISearchContent {
  productId: number;
  type: 'ai-search';
  version: string;
  basicInfo: {
    scientificName: string;
    commonNames: string[];
    category: string;
    family: string;
    origin: string;
    waterType: string;
  };
  searchKeywords: string[];
  careRequirements: {
    minTankSize: string;
    temperatureRange: string;
    phRange: string;
    maxSize: string;
    diet: string;
    careLevel: string;
    temperament: string;
    socialNeeds: string;
    lifespan: string;
  };
  compatibility: {
    compatibleWith: string[];
    avoidWith: string[];
    tankMateCategories: string[];
  };
  aiContext: {
    whyPopular: string;
    keySellingPoints: string[];
    commonQuestions: Array<{
      question: string;
      answer: string;
    }>;
    alternativeNames: string[];
  };
  relatedProducts: {
    complementaryProducts: string[];
    similarSpecies: string[];
  };
  breeding: {
    breedingType: string;
    breedingDifficulty: string;
    breedingNotes: string;
  };
  metadata: {
    generatedAt: string;
    lastUpdated: string;
    confidence: string;
    sources: string[];
    fishFamily: FishFamily;
    template: TemplateType;
  };
}

// Generated species content for Quick Reference
export interface SpeciesContent {
  productId: number;
  type: 'species';
  scientificName: string;
  commonName: string;
  quickReference: string[];
  generatedAt: string;
  metadata: {
    fishFamily: FishFamily;
    template: TemplateType;
  };
}

// Bulk processing job configuration
export interface ProcessingJob {
  id: string;
  categories: string[];
  products: Product[];
  config: ContentConfig;
  batchSize: number;
  concurrent: number;
  status: JobStatus;
  progress: {
    total: number;
    completed: number;
    failed: number;
    percentage: number;
  };
  startedAt?: string;
  completedAt?: string;
  errors: ProcessingError[];
}

// Job status tracking
export type JobStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

// Error tracking for failed generations
export interface ProcessingError {
  productId: number;
  productName: string;
  errorType: 'ai-generation' | 'validation' | 'deployment' | 'network';
  message: string;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
}

// Builder configuration options
export interface BuilderConfig {
  categories: string[];
  batchSize: number;
  concurrent: number;
  retries: number;
  validation: 'strict' | 'moderate' | 'lenient';
  outputPath: string;
  deployToCatalyst: boolean;
  progressCallback?: (progress: JobProgress) => void;
}

// Progress tracking interface
export interface JobProgress {
  jobId: string;
  status: JobStatus;
  total: number;
  completed: number;
  failed: number;
  percentage: number;
  currentProduct?: string;
  estimatedTimeRemaining?: number;
  errors: ProcessingError[];
}

// Fish categorization rules
export interface FishCategorizationRule {
  categoryPattern: RegExp;
  scientificNamePattern?: RegExp;
  commonNamePattern?: RegExp;
  family: FishFamily;
  behavior: FishBehavior;
  template: TemplateType;
  priority: number;
}

// Template configuration
export interface TemplateConfig {
  type: TemplateType;
  prompts: {
    basicInfo: string;
    careRequirements: string;
    compatibility: string;
    breeding: string;
    aiContext: string;
  };
  validation: {
    required: string[];
    optional: string[];
    maxLengths: Record<string, number>;
  };
  examples: {
    scientificName: string;
    commonName: string;
    sampleOutput: Partial<AISearchContent>;
  };
}

// Deployment configuration for Catalyst integration
export interface DeploymentConfig {
  catalystUrl: string;
  apiEndpoint: string;
  contentPath: string;
  publicPath: string;
  retries: number;
  timeout: number;
}

// Content validation results
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100 quality score
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'critical' | 'major' | 'minor';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion: string;
}

// Analytics and reporting
export interface GenerationReport {
  jobId: string;
  totalProducts: number;
  successfulGenerations: number;
  failedGenerations: number;
  averageGenerationTime: number;
  qualityScores: {
    average: number;
    median: number;
    distribution: Record<string, number>;
  };
  categoriesProcessed: string[];
  errors: ProcessingError[];
  startTime: string;
  endTime: string;
  duration: number;
}