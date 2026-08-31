import { computed } from "vue";
import { useRoute } from "vue-router";
import { menuData } from "~/constants/data/menuData";

export function useBreadcrumbs() {
  const route = useRoute();

  return computed(() => {
    const base: Array<{ text: string; href?: string }> = [
      { text: "ホーム", href: "/" },
    ];

    if (route.path === "/") {
      return { items: base, accent: "main" };
    }

    // Pass 1: Search for an EXACT match
    for (const section of menuData) {
      if (section.id === "home") continue;

      for (const item of section.items) {
        if (route.path === item.href) {
          const crumbs = [...base];
          if (section.heading) {
            crumbs.push({ text: section.heading, href: undefined });
          }
          crumbs.push({ text: item.text, href: item.href });
          return { items: crumbs, accent: section.accent || "main" };
        }
      }
    }

    // Pass 2: Search for a PREFIX match
    for (const section of menuData) {
      if (section.id === "home") continue;

      for (const item of section.items) {
        let isMatch = false;

        // Match by activePrefixes
        if (item.activePrefixes) {
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
          const crumbs = [...base];
          if (section.heading) {
            crumbs.push({ text: section.heading, href: undefined });
          }
          crumbs.push({ text: item.text, href: item.href });
          return { items: crumbs, accent: section.accent || "main" };
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

    return { items: [...base, ...dynamicCrumbs], accent: "main" };
  });
}
