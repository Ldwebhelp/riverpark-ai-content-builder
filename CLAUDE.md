# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev --turbopack` (runs Next.js dev server with Turbopack)
- **Build for production**: `npm run build --turbopack` (creates production build with Turbopack)
- **Start production server**: `npm run start`
- **Lint code**: `npm run lint` (runs ESLint with Next.js rules)

## Environment Setup

1. Copy `.env.example` to `.env.local` and configure your credentials:
   - **BigCommerce API**: Store hash and access token for product data
   - **OpenAI API**: API key for content generation
   - **Supabase**: Database URL and anon key for progress tracking

2. **BigCommerce Setup**: Create a custom app in BigCommerce with permissions:
   - Products: Read-only
   - Categories: Read-only

3. **Supabase Setup**: Run the schema from `src/lib/database/schema.sql` in your Supabase SQL editor

## Real-Time Data Integration

The system now fetches **ALL** data from BigCommerce without limits:
- **Categories**: Fetches all categories with product counts via pagination
- **Products**: Retrieves all products for selected categories or entire catalog
- **Progress Tracking**: Uses real product data for accurate progress reporting

## Project Architecture

This is the **Riverpark AI Content Builder**, an enterprise-scale AI content generation system designed to create comprehensive product content for 700+ freshwater aquarium livestock products. The system processes entire categories simultaneously using fish-family-specific templates and automated deployment.

### Core Components

- **AI Content Builder** (`src/builders/ai-content-builder.ts`): Main orchestrator that coordinates content generation
- **Bulk Processor** (`src/processors/bulk-processor.ts`): Handles batch processing of multiple products with job queue management
- **Fish Categorizer** (`src/utils/fish-categorizer.ts`): Intelligent classification system for fish families and behaviors
- **BigCommerce Integration** (`src/integrations/bigcommerce.ts`): Fetches products from BigCommerce API (1,657+ products)

### Processing Flow

1. **Product Fetching**: BigCommerce integration retrieves products by category
2. **Fish Classification**: Categorizer determines fish family, behavior, and appropriate template
3. **Content Generation**: OpenAI GPT-4 generates specialized content using family-specific templates
4. **Quality Validation**: Content validator ensures completeness and accuracy
5. **Deployment**: Catalyst integration deploys content to production

### Template System

The system uses specialized templates for different fish families:
- `cichlid-aggressive` / `cichlid-peaceful`: Lake Malawi/Tanganyika cichlids
- `tetra-schooling`: Community schooling fish (tetras, danios, barbs)
- `livebearer-breeding`: Livebearers (guppies, mollies, platys)
- `catfish-bottom`: Bottom-dwelling catfish and plecos
- `community-standard`: General community fish
- `specialty-care`: Unusual or high-maintenance species

### Key Directories

- `src/builders/`: Content generation orchestrators and family-specific builders
- `src/processors/`: Bulk processing engine and job queue management
- `src/templates/`: Content templates, prompt builders, and validation rules
- `src/integrations/`: External API integrations (BigCommerce, OpenAI)
- `src/utils/`: Fish categorization and utility functions
- `src/types/`: TypeScript type definitions for the entire system

### Environment Setup

The project uses:
- **Next.js 15** with TypeScript and Turbopack for fast development
- **Tailwind CSS 4** for styling
- **OpenAI GPT-4** for content generation
- **Supabase** for data storage
- External APIs for BigCommerce product data

### Content Types

Generated content follows the `AISearchContent` interface with structured sections:
- Basic fish information (scientific name, family, origin)
- Care requirements (tank size, water parameters, diet)
- Compatibility information (tank mates, avoid-with lists)
- AI context (why popular, selling points, Q&A)
- SEO keywords and metadata

### Processing Scale

The system is designed for enterprise-scale processing:
- Process 50-100 products simultaneously
- Handle 10+ categories in parallel
- Generate content for 700+ products total
- Maintain 95% time savings over manual content creation

### Quality Controls

- Content validation with scoring system (0-100)
- Automatic retry logic for failed generations
- Low-confidence product identification and handling
- Template-specific validation rules