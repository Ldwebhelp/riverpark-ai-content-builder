export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">🏗️</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Riverpark AI Content Builder</h1>
              <p className="text-gray-600">Revolutionary content generation for 700+ aquarium products</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Scale AI Content Generation
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Purpose-built for bulk processing of freshwater livestock content with
            fish-family-specific templates and automated deployment.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Bulk Processing */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🔥</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Bulk Processing Engine</h3>
            <ul className="text-gray-600 space-y-2">
              <li>• Process 50-100 products simultaneously</li>
              <li>• Category-specific content templates</li>
              <li>• Intelligent fish family detection</li>
              <li>• Automated quality validation</li>
            </ul>
          </div>

          {/* Smart Generation */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🧠</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Content Generation</h3>
            <ul className="text-gray-600 space-y-2">
              <li>• Fish-family specialized templates</li>
              <li>• SEO-optimized search keywords</li>
              <li>• Care requirements & compatibility</li>
              <li>• Customer Q&A generation</li>
            </ul>
          </div>

          {/* Production Pipeline */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Production Pipeline</h3>
            <ul className="text-gray-600 space-y-2">
              <li>• Direct BigCommerce integration</li>
              <li>• Automated Catalyst deployment</li>
              <li>• Real-time progress tracking</li>
              <li>• Error recovery & retry logic</li>
            </ul>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 mb-16">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Project Scope</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">700+</div>
              <div className="text-gray-600">Total Products</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">40+</div>
              <div className="text-gray-600">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">95%</div>
              <div className="text-gray-600">Time Savings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">100%</div>
              <div className="text-gray-600">SEO Coverage</div>
            </div>
          </div>
        </div>

        {/* Major Categories */}
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">Major Categories to Process</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="font-semibold text-blue-900">Lake Malawi Cichlids</div>
              <div className="text-blue-600">64 products</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="font-semibold text-green-900">Livebearers</div>
              <div className="text-green-600">60 products</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="font-semibold text-purple-900">Central/South American</div>
              <div className="text-purple-600">53 products</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="font-semibold text-orange-900">Tetras</div>
              <div className="text-orange-600">43 products</div>
            </div>
          </div>
          <div className="mt-4 text-gray-600 text-center">
            + 36 additional categories with 500+ more products
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            Built for <span className="font-semibold">Riverpark Aquatics</span> -
            Professional aquarium business content generation at enterprise scale
          </p>
        </div>
      </footer>
    </div>
  );
}
