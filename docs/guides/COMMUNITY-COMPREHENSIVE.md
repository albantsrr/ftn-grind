# FortiFlow Community Features - Comprehensive Guide

Complete documentation for community system including sharing, tags, ratings, search, and UX improvements.

## Quick Reference

**Features:** Public routine sharing | Tag categorization | 5-star rating system | Advanced search/filters | Pagination (12/page)

**Premium Access:** Community features require Premium subscription (€3.99/month)

## Feature Overview

### 1. Routine Sharing System
Users can toggle routines public/private. Public routines appear in Community page with author attribution.

**Backend:** `routers/community.py`
- `GET /api/community/routines` - List public routines (Premium only)
- `POST /api/community/routines/{id}/share` - Toggle public/private

**Database:**
- `routines.is_public` (boolean)
- `routines.author_name` (text) - displays creator username

**Frontend:** `pages/Community.tsx`, "Share" button in `RoutineCard.tsx`

### 2. Tags System
Categorize routines with colored tags. Pre-seeded with 8 default tags.

**Default Tags:**
- Aim (Blue), Build (Green), Edit (Purple), Movement (Orange)
- Box Fight (Red), Zone Wars (Teal), Warm-up (Yellow), Creative (Pink)

**Backend:** `routers/tags.py`
- `GET /api/tags/` - List all tags
- `POST /api/tags/routines/{id}/tags` - Add tag to routine (body: `{"tag_id": 1}`)
- `DELETE /api/tags/routines/{id}/tags/{tag_id}` - Remove tag

**Database:**
- `tags` (id, nom, color)
- `routine_tags` (many-to-many: routine_id, tag_id)

**Frontend:**
- `components/TagBadge.tsx` - Colored tag display
- `components/TagSelector.tsx` - Multi-select dropdown
- Integrated in `CreateRoutine.tsx`, `EditRoutine.tsx`, `RoutineCard.tsx`

### 3. Rating System
Users rate public routines 1-5 stars. One rating per user per routine.

**Backend:** `routers/ratings.py`
- `POST /api/ratings/routines/{id}/rate` - Rate routine (body: `{"rating": 5}`)
- `GET /api/ratings/routines/{id}/rating` - Get rating info (average, total, user's rating)
- `DELETE /api/ratings/routines/{id}/rate` - Remove user's rating

**Database:**
- `routine_ratings` (id, routine_id, user_id, rating, created_at) - unique constraint on (routine_id, user_id)
- `routines.average_rating` (float 0-5) - recalculated on each rating change
- `routines.total_ratings` (int) - count of ratings

**Frontend:** `components/RatingStars.tsx`
- **Display mode:** Shows average + total (e.g., "4.3 (12)")
- **Interactive mode:** Clickable stars for rating
- Half-star rendering for averages (e.g., 3.7 → 3.5 stars)

**Restrictions:**
- Cannot rate own routines
- Can update/delete existing rating

### 4. Search & Filters
Advanced filtering with debounced search and multi-criteria filtering.

**Backend:** `routers/community.py` query parameters
- `search` - Search routine name (case-insensitive, partial match)
- `author` - Filter by author name (case-insensitive, partial match)
- `tags` - Filter by tag IDs (comma-separated, e.g., `tags=1,3`)
- `sort_by` - Sort order: `date` (newest), `name` (A-Z), `rating` (highest)
- `skip` & `limit` - Pagination (default: 0, 12)

**Frontend:**
- `components/SearchBar.tsx` - Search input with 400ms debounce
- `components/FilterPanel.tsx` - Collapsible tag filter panel with checkboxes
- Active filter summary chip display
- Clear all filters button

**Sorting Options:**
1. **Plus récent** (date) - Newest first (default)
2. **Alphabétique** (name) - A-Z
3. **Mieux notés** (rating) - Highest rated first

### 5. UX Improvements

**Loading States:**
- `components/SkeletonCard.tsx` - Animated placeholder cards during load
- Shimmer effect for smooth UX

**Animations:**
- Fade-in on routine cards (staggered for list)
- Hover scale effects on cards
- Smooth transitions on filter panel collapse

**Tooltips:**
- `components/Tooltip.tsx` - Hover tooltips for icons/buttons
- Used for rating stars, share buttons, filters

**Error Handling:**
- User-friendly error messages
- Empty state messages ("Aucune routine trouvée")
- Network error recovery

**Pagination:**
- Shows 12 routines per page
- Previous/Next navigation buttons
- Page number display (e.g., "Page 1 sur 3")
- Disabled state for edge pages

## API Response Examples

### List Public Routines
```http
GET /api/community/routines?search=aim&tags=1,3&sort_by=rating&skip=0&limit=12
```

Response:
```json
{
  "routines": [
    {
      "id": 42,
      "nom": "Aim Training Pro",
      "author_name": "PlayerOne",
      "average_rating": 4.5,
      "total_ratings": 12,
      "tags": [
        {"id": 1, "nom": "Aim", "color": "#3B82F6"},
        {"id": 3, "nom": "Edit", "color": "#A855F7"}
      ],
      "image_url": "https://...",
      "date": "2024-01-15T10:30:00Z",
      "steps": [...]
    }
  ],
  "total": 42,
  "skip": 0,
  "limit": 12
}
```

### Rate Routine
```http
POST /api/ratings/routines/42/rate
Content-Type: application/json

{"rating": 5}
```

Response:
```json
{
  "message": "Rating added successfully",
  "average_rating": 4.6,
  "total_ratings": 13
}
```

### Get Rating Info
```http
GET /api/ratings/routines/42/rating
```

Response:
```json
{
  "average_rating": 4.6,
  "total_ratings": 13,
  "user_rating": 5
}
```

## Implementation Details

### Backend Query Logic

**Tag Filtering:**
```python
if tags:
    tag_list = [int(t) for t in tags.split(",")]
    query = query.join(routine_tags).filter(routine_tags.c.tag_id.in_(tag_list))
```

**Search:**
```python
if search:
    query = query.filter(Routine.nom.ilike(f"%{search}%"))
if author:
    query = query.filter(Routine.author_name.ilike(f"%{author}%"))
```

**Sorting:**
```python
if sort_by == "rating":
    query = query.order_by(Routine.average_rating.desc())
elif sort_by == "name":
    query = query.order_by(Routine.nom.asc())
else:  # date
    query = query.order_by(Routine.date.desc())
```

### Frontend State Management

**Community.tsx State:**
```tsx
const [routines, setRoutines] = useState<Routine[]>([])
const [searchTerm, setSearchTerm] = useState("")
const [selectedTags, setSelectedTags] = useState<number[]>([])
const [sortBy, setSortBy] = useState("date")
const [currentPage, setCurrentPage] = useState(1)
const [loading, setLoading] = useState(true)
```

**Debounced Search:**
```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    fetchRoutines()
  }, 400)
  return () => clearTimeout(timer)
}, [searchTerm, selectedTags, sortBy, currentPage])
```

### Tag Color Palette
Default tags use Tailwind colors for consistency:
- `#3B82F6` (Blue) - Aim
- `#10B981` (Green) - Build
- `#A855F7` (Purple) - Edit
- `#F97316` (Orange) - Movement
- `#EF4444` (Red) - Box Fight
- `#14B8A6` (Teal) - Zone Wars
- `#FBBF24` (Yellow) - Warm-up
- `#EC4899` (Pink) - Creative

## Testing Procedures

### Manual Test Plan

**1. Routine Sharing:**
- [ ] Create routine → Share button toggles `is_public`
- [ ] Shared routine appears in Community page
- [ ] Author name displays correctly
- [ ] Unshare removes from Community

**2. Tags:**
- [ ] Create routine with multiple tags
- [ ] Tags display with correct colors on card
- [ ] Edit routine → add/remove tags
- [ ] Tag selector shows all 8 default tags

**3. Ratings:**
- [ ] Rate public routine → stars update
- [ ] View average rating on card (e.g., "4.3 (12)")
- [ ] Cannot rate own routine (button disabled)
- [ ] Update existing rating → average recalculates
- [ ] Delete rating → total count decrements

**4. Search & Filters:**
- [ ] Type in search → results filter after 400ms
- [ ] Select tag filters → only matching routines show
- [ ] Change sort order → list reorders
- [ ] Combine search + tags + sort → all apply
- [ ] Clear filters → show all routines

**5. Pagination:**
- [ ] 12 routines per page
- [ ] Next/Previous buttons work
- [ ] Page number updates correctly
- [ ] First page → Previous disabled
- [ ] Last page → Next disabled

**6. UX:**
- [ ] Skeleton cards show during load
- [ ] Fade-in animation on routine cards
- [ ] Hover effects on cards
- [ ] Tooltips appear on icon hover
- [ ] Empty state message when no results

### Automated Tests

**Backend:** `backend/tests/test_community.py`, `test_tags.py`, `test_ratings.py`
```bash
cd backend
pytest tests/test_community.py -v
pytest tests/test_tags.py -v
pytest tests/test_ratings.py -v
```

**Key Test Cases:**
- Public routine listing with filters
- Tag CRUD operations
- Rating constraints (unique per user)
- Average rating calculation
- Search case-insensitivity
- Pagination boundary conditions

## Common Issues

**Routines not appearing in Community:**
- Verify `is_public = true` on routine
- Check user has Premium subscription
- Ensure backend API reachable

**Tags not saving:**
- Check `routine_tags` junction table populated
- Verify tag IDs exist in `tags` table
- Check for foreign key constraint errors

**Rating not updating:**
- Verify unique constraint on (routine_id, user_id)
- Check average recalculation trigger
- Ensure user authenticated (JWT valid)

**Search not working:**
- Verify 400ms debounce delay
- Check case-insensitive SQL query (`ILIKE`)
- Ensure search term properly encoded in URL

**Pagination breaks:**
- Check total count matches query results
- Verify skip/limit calculations: `skip = (page - 1) * limit`
- Ensure page number resets on filter change

## File Locations

**Backend:**
- `backend/routers/community.py` - Public routine listing, sharing
- `backend/routers/tags.py` - Tag management
- `backend/routers/ratings.py` - Rating system
- `backend/models.py` - Database schema (tags, ratings tables)
- `backend/tests/test_community.py` - Community tests

**Frontend:**
- `frontend/src/pages/Community.tsx` - Main community page
- `frontend/src/components/TagBadge.tsx` - Tag display
- `frontend/src/components/TagSelector.tsx` - Tag picker
- `frontend/src/components/RatingStars.tsx` - Rating component
- `frontend/src/components/SearchBar.tsx` - Search input
- `frontend/src/components/FilterPanel.tsx` - Filter panel
- `frontend/src/components/SkeletonCard.tsx` - Loading skeleton
- `frontend/src/components/Tooltip.tsx` - Tooltip component
- `frontend/src/services/api.ts` - API calls (community, tags, ratings)
