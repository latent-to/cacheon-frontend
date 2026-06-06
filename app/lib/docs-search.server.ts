import { createFromSource } from 'fumadocs-core/search/server'
import { source } from '~/lib/source.server'

/** Same Orama index backing docs Ctrl+K search (`/api/search`). */
export const docsSearch = createFromSource(source)

// Warm Orama index on first import so chat search does not cold-start timeout.
void docsSearch.search('cacheon', { limit: 1 }).catch(() => {})
