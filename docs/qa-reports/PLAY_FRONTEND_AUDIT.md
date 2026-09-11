# Play Frontend Audit

## 1. Game Cards
- **Current Problem**: Cards are large, have empty spaces, heights vary based on text wrap, lack a primary call-to-action button, and metadata is stacked awkwardly.
- **Root Cause**: The `.gameCard` CSS relies on basic flex column layout without fixed flex-grow rules or line clamps. The `<Link>` wraps the whole card but there is no visual `Play` button element inside the grid cards. Metadata is separated into two `<small>` tags in a flex column.
- **Affected Component**: `src/app/play/page.tsx` & `page.module.css`
- **Fix**: Redesign card layout with a structured DOM: Top Icon Area (fixed height), Content Area (flex-grow with line-clamp for description), Metadata Row (horizontal flex with icons), and Button Area (Primary 'Play' button fixed to bottom). Use CSS grid breakpoints (3 cols desktop, 2 cols tablet, 1 col mobile) instead of `auto-fit` with large minimums.

## 2. Header & Personalization
- **Current Problem**: Basic "Choose an Activity" header without personalization or warmth.
- **Root Cause**: Hardcoded strings, lack of integration with `useUserProfile` context to fetch user name, missing time-of-day greeting.
- **Affected Component**: `src/app/play/page.tsx`
- **Fix**: Fetch user profile via context. Create a dynamic greeting ("Good Morning, [Name]"). Redesign the header layout to feel like a warm dashboard header.

## 3. "Suggested for You" Section
- **Current Problem**: Exists, but layout breaks on mobile, feels disconnected, and recommends a hardcoded first game.
- **Root Cause**: Flex row without `flex-wrap` or media queries. Hardcoded `CATEGORIES[0].games[0]`.
- **Affected Component**: `src/app/play/page.tsx` & `page.module.css`
- **Fix**: Make `.suggestedCard` responsive (stack on mobile). Wire it up to genuinely rotate based on a simple logic check or use a dynamic suggestion based on recent history if available. Improve the UI to match the premium "✨" styling requested.

## 4. Spacing & Hierarchy
- **Current Problem**: Too much vertical space, sections feel disconnected.
- **Root Cause**: Over-reliance on generic `margin-bottom: var(--spacing-xxl)` without a cohesive vertical rhythm system.
- **Affected Component**: `src/app/play/page.module.css`
- **Fix**: Standardize spacing (e.g., 48px between sections, 24px between categories and grids, 20px grid gap). Use subtle backgrounds or borders for categories instead of just massive white space.

## 5. Metadata Presentation
- **Current Problem**: "DifficultyLvl1" style strings or disconnected data.
- **Root Cause**: `gameMetaSmall` class simply dumps strings.
- **Affected Component**: `src/app/play/page.tsx`
- **Fix**: Format as `◉ {difficulty}   ⏱ {duration}` inline.

## 6. Play Action Visuals
- **Current Problem**: The user isn't sure where to click.
- **Root Cause**: Lack of a dedicated `[ ▶ Play ]` button on category cards.
- **Affected Component**: `src/app/play/page.tsx`
- **Fix**: Introduce a prominent, full-width or centered primary button at the bottom of each card to create an undeniable call to action.
