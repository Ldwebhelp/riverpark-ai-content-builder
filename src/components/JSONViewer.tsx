'use client';

import { useState, useEffect } from 'react';
import { Search, Edit3, Save, X, Download, Upload, Trash2, Eye, FileText } from 'lucide-react';

interface JSONFile {
  productId: number;
  productName: string;
  type: 'species' | 'ai-search';
  filename: string;
  content: any;
  lastModified: string;
  size: number;
}

interface JSONViewerProps {
  onClose?: () => void;
}

export default function JSONViewer({ onClose }: JSONViewerProps) {
  const [jsonFiles, setJsonFiles] = useState<JSONFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<JSONFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<JSONFile | null>(null);
  const [editingFile, setEditingFile] = useState<JSONFile | null>(null);
  const [editContent, setEditContent] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'species' | 'ai-search'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJSONFiles();
  }, []);

  useEffect(() => {
    filterFiles();
  }, [jsonFiles, searchTerm, filterType]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchJSONFiles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/json-files');
      if (!response.ok) throw new Error('Failed to fetch JSON files');
      const files = await response.json();
      setJsonFiles(files);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load JSON files');
    } finally {
      setIsLoading(false);
    }
  };

  const filterFiles = () => {
    let filtered = jsonFiles;

    if (searchTerm) {
      filtered = filtered.filter(file =>
        file.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.productId.toString().includes(searchTerm) ||
        file.filename.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(file => file.type === filterType);
    }

    setFilteredFiles(filtered);
  };

  const handleEdit = (file: JSONFile) => {
    setEditingFile(file);
    setEditContent(JSON.stringify(file.content, null, 2));
  };

  const handleSave = async () => {
    if (!editingFile) return;

    try {
      const parsedContent = JSON.parse(editContent);

      const response = await fetch('/api/json-files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: editingFile.productId,
          type: editingFile.type,
          content: parsedContent
        })
      });

      if (!response.ok) throw new Error('Failed to save file');

      // Update local state
      const updatedFiles = jsonFiles.map(file =>
        file.productId === editingFile.productId && file.type === editingFile.type
          ? { ...file, content: parsedContent, lastModified: new Date().toISOString() }
          : file
      );
      setJsonFiles(updatedFiles);

      setEditingFile(null);
      setEditContent('');
      setError(null);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format. Please check your syntax.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to save file');
      }
    }
  };

  const handleDelete = async (file: JSONFile) => {
    if (!confirm(`Are you sure you want to delete ${file.filename}?`)) return;

    try {
      const response = await fetch('/api/json-files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: file.productId,
          type: file.type
        })
      });

      if (!response.ok) throw new Error('Failed to delete file');

      setJsonFiles(jsonFiles.filter(f =>
        !(f.productId === file.productId && f.type === file.type)
      ));
      setSelectedFile(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };

  const handleDownload = (file: JSONFile) => {
    const blob = new Blob([JSON.stringify(file.content, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        // Extract productId and type from filename or content
        const productId = content.productId || parseInt(file.name.split('-')[0]);
        const type = file.name.includes('-species.json') ? 'species' : 'ai-search';

        // Create new file entry
        const newFile: JSONFile = {
          productId,
          productName: content.commonName || content.basicInfo?.commonNames?.[0] || `Product ${productId}`,
          type: type as 'species' | 'ai-search',
          filename: file.name,
          content,
          lastModified: new Date().toISOString(),
          size: file.size
        };

        setJsonFiles([...jsonFiles.filter(f =>
          !(f.productId === productId && f.type === type)
        ), newFile]);
        setError(null);
      } catch (err) {
        setError('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading JSON files...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold">JSON File Manager</h2>
            <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
              {filteredFiles.length} files
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by product name, ID, or filename..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="species">Species Files</option>
              <option value="ai-search">AI Search Files</option>
            </select>

            <label className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Upload JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={fetchJSONFiles}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
            >
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* File List */}
          <div className="w-1/3 border-r overflow-y-auto">
            {filteredFiles.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No JSON files found</p>
                <p className="text-sm">Generate content to create JSON files</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {filteredFiles.map((file) => (
                  <div
                    key={`${file.productId}-${file.type}`}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedFile?.productId === file.productId && selectedFile?.type === file.type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedFile(file)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {file.productName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {file.filename}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded ${
                            file.type === 'species'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {file.type}
                          </span>
                          <span className="text-xs text-gray-400">
                            {(file.size / 1024).toFixed(1)}KB
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* File Viewer/Editor */}
          <div className="flex-1 flex flex-col">
            {selectedFile ? (
              <>
                {/* File Actions */}
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{selectedFile.filename}</h3>
                      <p className="text-sm text-gray-600">
                        Product: {selectedFile.productName} (ID: {selectedFile.productId})
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDownload(selectedFile)}
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(selectedFile)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(selectedFile)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                  {editingFile?.productId === selectedFile.productId && editingFile?.type === selectedFile.type ? (
                    <div className="h-full flex flex-col">
                      <div className="p-4 border-b bg-yellow-50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-yellow-800">
                            Editing {selectedFile.filename}
                          </span>
                          <div className="space-x-2">
                            <button
                              onClick={handleSave}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center space-x-1"
                            >
                              <Save className="h-3 w-3" />
                              <span>Save</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingFile(null);
                                setEditContent('');
                                setError(null);
                              }}
                              className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 p-4 font-mono text-sm border-none resize-none focus:outline-none"
                        placeholder="Enter valid JSON content..."
                      />
                    </div>
                  ) : (
                    <div className="h-full overflow-auto">
                      <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                        {JSON.stringify(selectedFile.content, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a JSON file to view its content</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}