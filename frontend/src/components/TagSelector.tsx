import { useState, useEffect } from 'react';
import type { Tag } from '../types';
import { api } from '../services/api';
import TagBadge from './TagBadge';

interface TagSelectorProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  routineId?: number;
}

export default function TagSelector({ selectedTags, onTagsChange, routineId }: TagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const tags = await api.getTags();
      setAvailableTags(tags);
    } catch (err) {
      console.error('Failed to load tags:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = async (tag: Tag) => {
    // If editing existing routine, add tag via API
    if (routineId) {
      try {
        await api.addTagToRoutine(routineId, { nom: tag.nom, color: tag.color });
        onTagsChange([...selectedTags, tag]);
      } catch (err) {
        alert('Failed to add tag');
        console.error(err);
      }
    } else {
      // If creating new routine, just update local state
      if (!selectedTags.find(t => t.id === tag.id)) {
        onTagsChange([...selectedTags, tag]);
      }
    }
    setIsOpen(false);
  };

  const handleRemoveTag = async (tag: Tag) => {
    // If editing existing routine, remove tag via API
    if (routineId) {
      try {
        await api.removeTagFromRoutine(routineId, tag.id);
        onTagsChange(selectedTags.filter(t => t.id !== tag.id));
      } catch (err) {
        alert('Failed to remove tag');
        console.error(err);
      }
    } else {
      // If creating new routine, just update local state
      onTagsChange(selectedTags.filter(t => t.id !== tag.id));
    }
  };

  const unselectedTags = availableTags.filter(
    tag => !selectedTags.find(t => t.id === tag.id)
  );

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Tags
      </label>

      {/* Selected Tags */}
      <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {selectedTags.length > 0 ? (
          selectedTags.map(tag => (
            <TagBadge
              key={tag.id}
              tag={tag}
              onRemove={() => handleRemoveTag(tag)}
              size="md"
            />
          ))
        ) : (
          <span className="text-gray-400 dark:text-gray-500 text-sm">
            Aucun tag sélectionné
          </span>
        )}
      </div>

      {/* Add Tag Button & Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter un tag
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Chargement...</div>
            ) : unselectedTags.length > 0 ? (
              <div className="p-2">
                {unselectedTags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <TagBadge tag={tag} size="sm" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                Tous les tags sont sélectionnés
              </div>
            )}
          </div>
        )}
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-[5]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
