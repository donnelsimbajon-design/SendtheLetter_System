# Community Feed Redesign — Source and acceptance notes

**Review branch:** design/community-feed-three-column-20261103  
**Status:** Proposed UI implementation, not automatically deployed.

## Why

The old Community screen centered a large empty intro/topic section and then a three-column grid of small cards. The reference screenshots ask for the social usability of a central activity feed, preserved original SendTheLetter navigation icons, recommended writers on the left, and relevant discovery/trending space on the right.

## Layout

- **Header:** Existing `DashboardLayout` navbar, unchanged; all original local mascot icons remain.
- **Left desktop column:** Recommended writers (from released, non-anonymous public letters), current topic shortcuts (actual category counts), contextual writing CTA.
- **Center desktop column:** Quick compose card, native mascot actions to existing writing editor, topic chips, text search, sort, full-width vertically stacked public letter posts, full reader, actual like/comment/share affordances and show-more pagination.
- **Right desktop column:** Popular topics, top appreciated letters (nonzero actual likes) in the selected feed, rotating daily writing prompt and privacy/community reminder.
- **Tablet/mobile:** Center feed first; related discovery sections flow below the feed. Original account and mobile navigation remain available.

## Honest data contract and privacy

Only the existing `/api/letters/public` data is used; no new backend API or data collection was introduced. Before rendering or computing recommendations, exclude items that are not public, not published, archived, or scheduled/time-capsule locked. When the date is invalid, the letter is not eligible for discovery.

- **Popular topics** means category frequency within the public response currently loaded, **not a real-time site-wide trending chart**.
- **Recommended writers** are authors of visible public letters, grouped by writer name and sorted by number of such letters and recency. Anonymous posts and placeholder/missing author names never appear in recommendations.
- **Most appreciated** comes from public letters matching the *current* filters with recorded likes greater than zero; never fabricated numbers.
- **Today's prompt** is a rotating client-side editorial question, not a claimed behavioral recommendation.
- Users must make the Private/Public choice within the existing editor. The composer shortcuts do not post content directly or change visibility.
- Displayed letters are normal text/React strings; no injection of user-authored markup.

## Testing

The browser smoke suite includes new automated checks for 3-column desktop layout, own-header mascot artwork, public and anonymous privacy rules, live-data-based category counts, sidebar stories/filters, keyboard reader, likes, progressive show-more, and compact 320px layout.

**Browser tests use mocked API responses and are not real production/staging integration validation.** Existing source build, dependency audits and TypeScript checks also run on PRs.

## Before merge / release

- [ ] Current PR HEAD passes frontend and browser CI.
- [ ] Review desktop at 1280px, 1440px and 1600px and phones at 320px/375px/414px.
- [ ] Verify feed + sidebars fit small laptops and avoid overlapping fixed header and bottom navigation.
- [ ] Check Warm Editorial, Cool Blue and Forest Night themes, reduced motion, contrast and keyboard tab flow.
- [ ] Verify original artwork on all responsive breakpoints.
- [ ] Test with real staging user accounts, including anonymous authors, previously blocked accounts, private drafts and future-sealed letters.
- [ ] Test likes, comments, shares and profile navigation against staging APIs.
- [ ] Verify image loading, long text, unicode and empty/error/timeout cases.
- [ ] Confirm rollout safety and latest GitHub/Render live SHAs before considering production.
- [ ] Review and explicitly approve the draft PR and any deployment.

No Render deployment, database migration, secret rotation or backend modifications are part of this change.
