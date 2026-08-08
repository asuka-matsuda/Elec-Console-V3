import { computed } from "vue";
import { useRoute } from "vue-router";
import { menuData } from "../utils/menuData";

export function useBreadcrumbs() {
  const route = useRoute();

  return computed(() => {
    const base: Array<{ text: string; href?: string }> = [
      { text: "ホーム", href: "/" },
    ];

    if (route.path === "/") {
      return base;
    }

    // Search for a matching item in menuData
    for (const section of menuData) {
      if (section.id === "home") continue;

      for (const item of section.items) {
        let isMatch = route.path === item.href;

        // Match by activePrefixes
        if (!isMatch && item.activePrefixes) {
          isMatch = item.activePrefixes.some((prefix) =>
            route.path.startsWith(prefix),
          );
        }

        // Match by nested paths (e.g. /tools/calc-voltage/result)
        if (!isMatch && item.href !== "/") {
          if (route.path.startsWith(item.href + "/")) {
            isMatch = true;
          }
        }

        if (isMatch) {
          // Found the active menu item!
          const crumbs = [...base];

          if (section.heading) {
            crumbs.push({ text: section.heading, href: undefined });
          }

          crumbs.push({ text: item.text, href: item.href });

          return crumbs;
        }
      }
    }

    // Fallback if the route is not defined in menuData (e.g. dynamic/error pages)
    const segments = route.path.split("/").filter(Boolean);
    const dynamicCrumbs = segments.map((seg, idx) => {
      const isLast = idx === segments.length - 1;
      return {
        text: seg.charAt(0).toUpperCase() + seg.slice(1), // Capitalize
        href: isLast ? undefined : "/" + segments.slice(0, idx + 1).join("/"),
      };
    });

    return [...base, ...dynamicCrumbs];
  });
}
