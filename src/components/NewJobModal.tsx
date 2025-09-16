'use client';

import { useState, useEffect } from 'react';
import { FishFamily, TemplateType } from '@/types/content';

interface NewJobModalProps {
  onClose: () => void;
  onSubmit: (jobConfig: unknown) => void;
}

interface Category {
  id: number;
  name: string;
  product_count: number;
}

const FISH_FAMILIES: FishFamily[] = [
  'cichlids',
  'tetras',
  'livebearers',
  'catfish',
  'barbs',
  'danios',
  'gouramis',
  'loaches',
  'rainbowfish',
  'community',
  'specialty'
];

const TEMPLATE_TYPES: TemplateType[] = [
  'cichlid-aggressive',
  'cichlid-peaceful',
  'tetra-schooling',
  'livebearer-breeding',
  'catfish-bottom',
  'community-standard',
  'specialty-care'
];

export default function NewJobModal({ onClose, onSubmit }: NewJobModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [batchSize, setBatchSize] = useState(25);
  const [concurrent, setConcurrent] = useState(5);
  const [fishFamily, setFishFamily] = useState<FishFamily>('community');
  const [templateType, setTemplateType] = useState<TemplateType>('community-standard');
  const [aiModel, setAiModel] = useState<'gpt-4o' | 'gpt-4' | 'gpt-4-turbo'>('gpt-4o');
  const [validation, setValidation] = useState<'strict' | 'moderate' | 'lenient'>('moderate');
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Load categories from BigCommerce on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedCategories.length === 0) {
      alert('Please select at least one category');
      return;
    }

    const jobConfig = {
      categories: selectedCategories,
      batchSize,
      concurrent,
      config: {
        family: fishFamily,
        behavior: 'community-friendly',
        templateType,
        aiModel,
        validation
      }
    };

    onSubmit(jobConfig);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create New AI Content Job</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Categories Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Categories to Process
            </label>
            {isLoadingCategories ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading categories from BigCommerce...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {categories.map(category => (
                  <label key={category.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{category.name}</span>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {category.product_count} products
                    </span>
                  </label>
                ))}
                {categories.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No categories found. Check BigCommerce connection.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Processing Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Size
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Concurrent Jobs
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={concurrent}
                onChange={(e) => setConcurrent(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              />
            </div>
          </div>

          {/* AI Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fish Family
              </label>
              <select
                value={fishFamily}
                onChange={(e) => setFishFamily(e.target.value as FishFamily)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              >
                {FISH_FAMILIES.map(family => (
                  <option key={family} value={family}>
                    {family.charAt(0).toUpperCase() + family.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Type
              </label>
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value as TemplateType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              >
                {TEMPLATE_TYPES.map(template => (
                  <option key={template} value={template}>
                    {template.split('-').map(word =>
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Model
              </label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value as 'gpt-4o' | 'gpt-4' | 'gpt-4-turbo')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="gpt-4o">GPT-4o (Recommended)</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Validation Level
              </label>
              <select
                value={validation}
                onChange={(e) => setValidation(e.target.value as 'strict' | 'moderate' | 'lenient')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="lenient">Lenient</option>
                <option value="moderate">Moderate</option>
                <option value="strict">Strict</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Start Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}