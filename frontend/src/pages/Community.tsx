import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Routine } from '../types';
import { api } from '../services/api';
import Sidebar from '../components/Sidebar';
import RoutineCard from '../components/RoutineCard';
import ThemeToggle from '../components/ThemeToggle';
import RatingStars from '../components/RatingStars';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import SkeletonCard from '../components/SkeletonCard';
import PaywallModal from '../components/PaywallModal';
import { useAuth } from '../contexts/AuthContext';
import { GRADE_BADGES, type GradeName } from '../config/grades';

export default function Community() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'nom' | 'rating'>('date');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showPaywall, setShowPaywall] = useState(false);
  const [userGrade, setUserGrade] = useState<string | null>(null);

  // Check for Premium access
  const isPremium = user?.subscription_tier === 'premium';

  // Check Premium access on mount
  useEffect(() => {
    if (!isPremium) {
      setShowPaywall(true);
    }
  }, [isPremium]);

  // Load user grade if Premium
  useEffect(() => {
    if (isPremium) {
      api.getUserStats()
        .then(stats => setUserGrade(stats.grade))
        .catch(err => console.error('Failed to load user grade:', err));
    }
  }, [isPremium]);

  // Load routines when filters change
  useEffect(() => {
    if (isPremium) {
      loadCommunityRoutines();
    } else {
      // For Free users, immediately stop loading to show paywall
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, searchQuery, selectedTagIds, currentPage, isPremium]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTagIds]);

  const loadCommunityRoutines = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = {
        sort_by: sortBy,
        limit: itemsPerPage,
        skip: (currentPage - 1) * itemsPerPage
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (selectedTagIds.length > 0) {
        params.tags = selectedTagIds.join(',');
      }

      const data = await api.getCommunityRoutines(params);
      setRoutines(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des routines communautaires');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleFilterChange = useCallback((tagIds: number[]) => {
    setSelectedTagIds(tagIds);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openRatingModal = async (routine: Routine) => {
    setSelectedRoutine(routine);
    setRatingError(null);

    try {
      const ratingInfo = await api.getRoutineRating(routine.id!);
      setUserRating(ratingInfo.user_rating || 0);
    } catch (err) {
      console.error('Failed to load rating:', err);
      setUserRating(0);
    }

    setShowRatingModal(true);
  };

  const closeRatingModal = () => {
    setShowRatingModal(false);
    setSelectedRoutine(null);
    setUserRating(0);
    setRatingError(null);
  };

  const handleRateRoutine = async (rating: number) => {
    if (!selectedRoutine) return;

    try {
      setRatingError(null);
      await api.rateRoutine(selectedRoutine.id!, { rating });
      await loadCommunityRoutines();
      closeRatingModal();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la notation';
      setRatingError(errorMessage);
      console.error(err);
    }
  };

  const handleImportRoutine = async (routine: Routine) => {
    try {
      // Copy the routine without the id to create a new one
      const newRoutine = {
        nom: `${routine.nom} (Copie)`,
        date: new Date().toISOString().split('T')[0],
        sound_type: routine.sound_type,
        volume: routine.volume,
        image_url: routine.image_url,
        is_public: false,
        steps: routine.steps.map(step => ({
          nom: step.nom,
          code_map: step.code_map,
          duree: step.duree,
          tips: step.tips,
          order: step.order
        }))
      };

      await api.createRoutine(newRoutine);

      // Show success message and redirect to home
      alert('✅ Routine importée avec succès !');
      navigate('/');
    } catch (err) {
      console.error('Failed to import routine:', err);
      alert('❌ Erreur lors de l\'importation de la routine');
    }
  };

  const handleDeleteRating = async () => {
    if (!selectedRoutine) return;

    try {
      setRatingError(null);
      await api.deleteRating(selectedRoutine.id!);
      await loadCommunityRoutines();
      closeRatingModal();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la note';
      setRatingError(errorMessage);
      console.error(err);
    }
  };

  // Don't show loading screen if user is Free tier (paywall will be shown)
  if (loading && routines.length === 0 && isPremium) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Chargement des routines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      {/* Paywall Modal */}
      <PaywallModal isOpen={showPaywall} onClose={() => navigate('/')} feature="Community" />

      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} username={user?.username || 'User'} subscriptionTier={user?.subscription_tier} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Globe Icon */}
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Communauté</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Découvrez les meilleures routines créées par la communauté
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                  title="Vue grille"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                  title="Vue liste"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-8 py-6">
            {/* Filters Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <SearchBar
                    onSearch={handleSearchChange}
                    placeholder="Rechercher une routine..."
                    debounceMs={400}
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-3">
                  <FilterPanel
                    onFilterChange={handleFilterChange}
                    initialSelectedTags={selectedTagIds}
                  />

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'nom' | 'rating')}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="date">Plus récent</option>
                    <option value="nom">Nom (A-Z)</option>
                    <option value="rating">Mieux notés</option>
                  </select>
                </div>
              </div>

              {/* Active Filters */}
              {(searchQuery || selectedTagIds.length > 0) && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Filtres actifs:</span>
                  {searchQuery && (
                    <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-sm">
                      "{searchQuery}"
                    </span>
                  )}
                  {selectedTagIds.length > 0 && (
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-sm">
                      {selectedTagIds.length} tag(s)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Routines Grid/List */}
            {loading ? (
              <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
                {[...Array(itemsPerPage)].map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <button
                  onClick={loadCommunityRoutines}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  Réessayer
                </button>
              </div>
            ) : routines.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-6xl mb-4">🌍</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Aucune routine trouvée</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Essayez de modifier vos filtres ou partagez votre première routine !
                </p>
              </div>
            ) : (
              <>
                <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
                  {routines.map((routine) => (
                    <div key={routine.id} className="relative">
                      <RoutineCard
                        routine={routine}
                        onImport={handleImportRoutine}
                        onRate={openRatingModal}
                        isCommunityView={true}
                      />

                      {/* Auteur overlay */}
                      {routine.author_name && (
                        <div className="absolute top-3 left-3 flex items-center gap-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                          <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {routine.author_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {routine.author_name}
                          </span>
                          {routine.author_name === user?.username && userGrade && (
                            <img
                              src={GRADE_BADGES[userGrade as GradeName]}
                              alt={`${userGrade} badge`}
                              title={`Grade: ${userGrade}`}
                              className="w-5 h-5 object-contain"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-8 flex justify-center">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Précédent
                    </button>
                    <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                      Page {currentPage}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={routines.length < itemsPerPage}
                      className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Rating Modal - Identique à avant */}
      {showRatingModal && selectedRoutine && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Noter la routine</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedRoutine.nom}</p>
              </div>
              <button onClick={closeRatingModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Note moyenne :</p>
              <RatingStars
                rating={selectedRoutine.average_rating || 0}
                totalRatings={selectedRoutine.total_ratings || 0}
                interactive={false}
                size="md"
              />
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {userRating > 0 ? 'Modifier votre note :' : 'Votre note :'}
              </p>
              <RatingStars
                rating={userRating}
                interactive={true}
                onRate={handleRateRoutine}
                size="lg"
              />
            </div>

            {ratingError && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                {ratingError}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              {userRating > 0 && (
                <button
                  onClick={handleDeleteRating}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                >
                  Supprimer ma note
                </button>
              )}
              <button
                onClick={closeRatingModal}
                className="ml-auto bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-2 rounded-lg font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
