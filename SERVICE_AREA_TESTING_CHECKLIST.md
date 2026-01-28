# Service Area Testing Checklist ✅

## All 11 Service Areas - Ready for Testing

### KENT Region (6 areas)
- [ ] **Canterbury** - Click link, verify page loads, check services display
- [ ] **Dover** - Coastal property specialists visible
- [ ] **Maidstone** - All services showing correctly  
- [ ] **Tunbridge Wells** - Luxury property highlights visible
- [ ] **Sevenoaks** - Estate property expertise showing
- [ ] **Ashford** - Rural specialists content loads

### SWALE Region (4 areas)
- [ ] **Sheerness-on-Sea** - Coastal services visible
- [ ] **Sittingbourne** ✅ **FIXED** - Services display correctly
- [ ] **Minster-on-Sea** ✅ **NEW** - Coastal services showing
- [ ] **Axminster** - Rural services loading

### LONDON Region (1 area)
- [ ] **Croydon** ✅ **FIXED** - London specialists visible

---

## Image Testing

- [ ] All hero images load properly
- [ ] Fallback image activates if primary URL fails
- [ ] Lazy loading enabled (check Network tab in DevTools)
- [ ] No console errors for missing/broken images
- [ ] Images render without CORS issues

---

## Navigation Testing

- [ ] Service Areas list page loads all 11 areas
- [ ] Can click on each area card
- [ ] Page transitions smooth
- [ ] Browser back button works correctly
- [ ] Direct URL works: `/service-areas/[slug]`
  - [ ] `/service-areas/sittingbourne`
  - [ ] `/service-areas/minster-on-sea`
  - [ ] `/service-areas/croydon`
- [ ] All area slugs match correctly

---

## Content Verification (per area)

For each service area, verify:
- [ ] Service area name correct
- [ ] Region labeled correctly
- [ ] Coverage area description complete
- [ ] Response time reasonable
- [ ] All 3 services listed (Residential, End of Tenancy, Airbnb)
- [ ] Local info content relevant
- [ ] Highlights section populated
- [ ] Hero image displaying
- [ ] Contact number visible (+44 1622 621133)

---

## Buttons & CTAs

- [ ] **Call Now** button functional (phone link works)
- [ ] **Get Free Quote** button navigates to quote form
- [ ] **WhatsApp** button opens chat
- [ ] All links open in correct context

---

## Browser Compatibility

- [ ] Chrome/Chromium
- [ ] Safari
- [ ] Firefox
- [ ] Edge

---

## Responsive Design

- [ ] Mobile view (< 640px) - Stacked layout
- [ ] Tablet view (640px - 1024px) - 2-column layout
- [ ] Desktop view (> 1024px) - Full layout
- [ ] Images scale correctly on all sizes
- [ ] Text readable on mobile

---

## Performance Metrics

- [ ] Page load time < 3 seconds
- [ ] Hero images load smoothly without jumping
- [ ] No layout shift (Cumulative Layout Shift)
- [ ] Lazy loading verified (check DevTools Network tab)
- [ ] Console has no errors or warnings

---

## Error Handling

- [ ] Invalid area slug shows "Area Not Found" page
- [ ] "View All Service Areas" button on error page works
- [ ] Back navigation restores scroll position (if browser supports)

---

## SEO Verification

- [ ] Page title includes area name
- [ ] Meta description present
- [ ] Schema markup visible in HTML (Local business schema)
- [ ] Open Graph tags present
- [ ] Canonical URL set correctly

---

## Issues Fixed in This Release

| Issue | Status | Evidence |
|-------|--------|----------|
| Sittingbourne services not showing | ✅ FIXED | servicesCovered typo corrected |
| Minster-on-Sea missing page | ✅ ADDED | New service area entry created |
| Croydon services not showing | ✅ FIXED | servicesCovered typo corrected |
| Image loading errors | ✅ ENHANCED | Fallback + lazy loading added |

---

## Testing Environment

- **Branch**: main
- **Commit**: 7eba59e
- **Date**: January 28, 2026
- **Frontend Port**: 5173 (Vite dev server)

---

## Test Execution

### Quick Smoke Test (5 min)
1. Load `/service-areas` page
2. Count visible areas (should show 11)
3. Click on Sittingbourne → services display ✓
4. Click on Minster-on-Sea → page loads ✓
5. Click on Croydon → services display ✓

### Full Test (30 min)
- Follow checklist items above
- Test all 11 areas
- Test all interaction points
- Check browser console for errors

### Performance Test (10 min)
- Open DevTools Network tab
- Reload page
- Verify lazy loading working
- Check image load times
- Verify < 3 second total load

---

## Notes

- External Unsplash URLs used - ensure internet connection
- Fallback image configured for offline/CORS issues
- All slugs match database Booking model `serviceArea` enum
- Phone number: +44 1622 621133 (matches across all areas)

---

## Sign-Off

- [ ] Developer: Tested locally - date: ___
- [ ] QA: Full test cycle completed - date: ___
- [ ] Ready for staging deployment: ___
- [ ] Ready for production: ___

---

**Status**: Ready for testing ✅  
**Last Updated**: January 28, 2026
