import { createClient } from '@supabase/supabase-js';
import { ProcessingJob, ProcessingError, AISearchContent } from '@/types/content';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export class DatabaseClient {
  // Job Management
  async createJob(jobData: Omit<ProcessingJob, 'id'>): Promise<ProcessingJob> {
    const { data, error } = await supabase
      .from('processing_jobs')
      .insert({
        categories: jobData.categories,
        batch_size: jobData.batchSize,
        concurrent: jobData.concurrent,
        status: jobData.status,
        config: jobData.config,
        progress: jobData.progress
      })
      .select()
      .single();

    if (error) throw error;
    return this.transformJobFromDB(data);
  }

  async updateJob(jobId: string, updates: Partial<ProcessingJob>): Promise<ProcessingJob> {
    const dbUpdates: any = {};

    if (updates.status) dbUpdates.status = updates.status;
    if (updates.progress) dbUpdates.progress = updates.progress;
    if (updates.completedAt) dbUpdates.completed_at = updates.completedAt;

    const { data, error } = await supabase
      .from('processing_jobs')
      .update(dbUpdates)
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw error;
    return this.transformJobFromDB(data);
  }

  async getJob(jobId: string): Promise<ProcessingJob | null> {
    const { data, error } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return this.transformJobFromDB(data);
  }

  async getAllJobs(): Promise<ProcessingJob[]> {
    const { data, error } = await supabase
      .from('processing_jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(job => this.transformJobFromDB(job));
  }

  async deleteJob(jobId: string): Promise<void> {
    const { error } = await supabase
      .from('processing_jobs')
      .delete()
      .eq('id', jobId);

    if (error) throw error;
  }

  // Error Management
  async addJobError(jobId: string, error: Omit<ProcessingError, 'timestamp'>): Promise<void> {
    const { error: dbError } = await supabase
      .from('processing_errors')
      .insert({
        job_id: jobId,
        product_id: error.productId,
        product_name: error.productName,
        error_type: error.errorType,
        message: error.message,
        retry_count: error.retryCount,
        max_retries: error.maxRetries
      });

    if (dbError) throw dbError;
  }

  async getJobErrors(jobId: string): Promise<ProcessingError[]> {
    const { data, error } = await supabase
      .from('processing_errors')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(err => ({
      productId: err.product_id,
      productName: err.product_name,
      errorType: err.error_type,
      message: err.message,
      timestamp: err.created_at,
      retryCount: err.retry_count,
      maxRetries: err.max_retries
    }));
  }

  // Content Management
  async saveGeneratedContent(
    jobId: string,
    content: AISearchContent
  ): Promise<void> {
    const { error } = await supabase
      .from('ai_generated_content')
      .insert({
        product_id: content.productId,
        job_id: jobId,
        content_type: content.type,
        version: content.version,
        basic_info: content.basicInfo,
        search_keywords: content.searchKeywords,
        care_requirements: content.careRequirements,
        compatibility: content.compatibility,
        ai_context: content.aiContext,
        related_products: content.relatedProducts,
        breeding: content.breeding,
        metadata: content.metadata,
        validation_score: parseInt(content.metadata.confidence === 'high' ? '90' :
                                 content.metadata.confidence === 'medium' ? '75' : '60')
      });

    if (error) throw error;
  }

  async getGeneratedContent(productId: number): Promise<AISearchContent | null> {
    const { data, error } = await supabase
      .from('ai_generated_content')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return this.transformContentFromDB(data);
  }

  // Progress Updates
  async addProgressUpdate(
    jobId: string,
    currentProduct?: string,
    estimatedTimeRemaining?: number,
    message?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('job_progress_updates')
      .insert({
        job_id: jobId,
        current_product: currentProduct,
        estimated_time_remaining: estimatedTimeRemaining,
        message
      });

    if (error) throw error;
  }

  async getLatestProgressUpdate(jobId: string): Promise<any> {
    const { data, error } = await supabase
      .from('job_progress_updates')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data;
  }

  // Product Cache Management
  async cacheProducts(products: any[]): Promise<void> {
    const productData = products.map(product => ({
      entity_id: product.entityId,
      product_id: product.productId,
      name: product.name,
      price: product.price,
      categories: product.categories,
      description: product.description,
      brand_name: product.brand?.name,
      image_url: product.defaultImage?.url,
      image_alt: product.defaultImage?.altText,
      path: product.path
    }));

    const { error } = await supabase
      .from('products')
      .upsert(productData, { onConflict: 'product_id' });

    if (error) throw error;
  }

  async getCachedProducts(categories?: string[]): Promise<any[]> {
    let query = supabase.from('products').select('*');

    if (categories && categories.length > 0) {
      query = query.overlaps('categories', categories);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  // Real-time subscriptions
  subscribeToJobUpdates(
    jobId: string,
    callback: (payload: any) => void
  ): () => void {
    const subscription = supabase
      .channel(`job-updates-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'processing_jobs',
          filter: `id=eq.${jobId}`
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  subscribeToProgressUpdates(
    jobId: string,
    callback: (payload: any) => void
  ): () => void {
    const subscription = supabase
      .channel(`progress-updates-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'job_progress_updates',
          filter: `job_id=eq.${jobId}`
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  // Private helper methods
  private transformJobFromDB(dbJob: any): ProcessingJob {
    return {
      id: dbJob.id,
      categories: dbJob.categories,
      products: [], // Would be populated separately if needed
      config: dbJob.config,
      batchSize: dbJob.batch_size,
      concurrent: dbJob.concurrent,
      status: dbJob.status,
      progress: dbJob.progress,
      startedAt: dbJob.started_at,
      completedAt: dbJob.completed_at,
      errors: [] // Would be populated separately if needed
    };
  }

  private transformContentFromDB(dbContent: any): AISearchContent {
    return {
      productId: dbContent.product_id,
      type: dbContent.content_type,
      version: dbContent.version,
      basicInfo: dbContent.basic_info,
      searchKeywords: dbContent.search_keywords,
      careRequirements: dbContent.care_requirements,
      compatibility: dbContent.compatibility,
      aiContext: dbContent.ai_context,
      relatedProducts: dbContent.related_products,
      breeding: dbContent.breeding,
      metadata: dbContent.metadata
    };
  }
}

export const db = new DatabaseClient();