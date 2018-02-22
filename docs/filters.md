# Using Filters
Almost every page has a filter button on it. This button will limit the data used
on each page such that the data matches the specified filters.

![Filter Panel]({{ "/images/filters-01.png" | absolute_url }})

A typical filter panel is shown above. If the button is green, that means a filter has been applied.
As an example, we can use the filters to create a player profile summary from Hero League games only.
We do this by selecting `Hero League` from the `Mode` menu, and then clicking search.

** Filters are not applied until you click search.**
Note also that each filter button is __separate__ and does not affect results app-wide.

Here's what the filter options are:
* Mode - Choose one or more of Quick Match, Hero League, Team League, Unranked Draft, and Custom.
If no mode is selected, all modes are allowed.
* Map - Choose one or more of the available standard maps (Brawls are not supported here).
* Patch - Choose one or more patches. This is similar to using start and end date but is a little more precise.
You will only see patch numbers for matches that exist in the database.
* Start/End date - Chose a date range to limit data to. Note that the end date is __exclusive__ right now,
meaning that you should set the end date to the next day in order to include the previous day's data.
* Hero Type - Limit results to one or more specified hero roles and types.
* Team - Restrict results to be from a specific team. This option is not present in all filter windows.

[Back](https://ebshimizu.github.io/stats-of-the-storm/)