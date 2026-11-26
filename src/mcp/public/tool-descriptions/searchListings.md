<purpose>
Lists public Kvutsa listings: new-build (presale) projects that developers offer to buyer groups, with group pricing, payment terms, expected delivery and seats. Only live, public listings are returned. Results are paged.
</purpose>

<use_cases>
- "Which new projects are offered in Netanya?" (pass city: "Netanya" or "נתניה")
- "What are the newest projects on Kvutsa?" (no city)
- "Show me more" (the same call with the next page)
</use_cases>

<negative_use_cases>
- Second-hand apartments or rentals (Kvutsa lists only presale projects)
- Joining a project or a buyer group (share the project's url: joining happens on the Kvutsa website)
- Private or draft listings (never returned)
</negative_use_cases>

<rules>
- Answer ONLY from the data this tool returns. Do not invent prices, dates or availability.
- Pass the city name exactly as the user wrote it. If the tool says several cities match, ask the user which one.
- Share each project's url.
- total tells how many projects exist: offer the next page when there are more.
</rules>
