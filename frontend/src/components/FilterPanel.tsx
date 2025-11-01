import { useState, useEffect } from 'react';
import type { Tag } from '../types';
import { api } from '../services/api';
import TagBadge from './TagBadge';

interface FilterPanelProps {
  onFilterChange: (selectedTagIds: number[]) => void;
  initialSelectedTags?: number[];
}

export default function FilterPanel({
  onFilterChange,
  initialSelectedTags = []
}: FilterPanelProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(initialSelectedTags);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load all available tags
  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const tags = await api.getTags();
      setAllTags(tags);
    } catch (error) {
      console.error('Failed to load tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagId: number) => {
    const newSelectedTagIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId];

    setSelectedTagIds(newSelectedTagIds);
    onFilterChange(newSelectedTagIds);
  };

  const clearAllFilters = () => {
    setSelectedTagIds([]);
    onFilterChange([]);
  };

  const selectedCount = selectedTagIds.length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-gray-600 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span className="font-semibold text-gray-900 dark:text-white">
            Filter by tags
          </span>
          {selectedCount > 0 && (
            <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {selectedCount}
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Filter Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="py-4 text-center text-gray-500 dark:text-gray-400">
              Chargement des tags...
            </div>
          ) : allTags.length === 0 ? (
            <div className="py-4 text-center text-gray-500 dark:text-gray-400">
              Aucun tag disponible
            </div>
          ) : (
            <>
              {/* Tags Grid */}
              <div className="pt-4 flex flex-wrap gap-2">
                {allTags.map(tag => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`transition-all ${
                        isSelected
                          ? 'ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-gray-800 scale-105'
                          : 'opacity-60 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      <TagBadge tag={tag} size="md" />
                    </button>
                  );
                })}
              </div>

              {/* Clear Filters Button */}
              {selectedCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="mt-4 w-full py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                >
                  Effacer tous les filtres
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
