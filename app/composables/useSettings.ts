import { useLocalStorage } from "@vueuse/core";

export const useSettings = () => {
  const themeMode = useLocalStorage<"dark" | "light">(
    "elec_theme_mode",
    "dark",
  );
  const baseBgStyle = useLocalStorage<"aurora" | "grid" | "gradient" | "solid">(
    "elec_base_bg_style",
    "solid",
  );

  // Solid Color Settings
  const solidColor = useLocalStorage("elec_solid_color", "#0f172a");

  // Gradient Settings
  const gradientColor1 = useLocalStorage("elec_gradient_c1", "#1e293b");
  const gradientColor2 = useLocalStorage("elec_gradient_c2", "#0f172a");

  // Aurora Settings
  const auroraColor1 = useLocalStorage("elec_aurora_c1", "#3b82f6");
  const auroraColor2 = useLocalStorage("elec_aurora_c2", "#8b5cf6");
  const auroraColor3 = useLocalStorage("elec_aurora_c3", "#ec4899");
  const auroraColor4 = useLocalStorage("elec_aurora_c4", "#06b6d4");

  // Grid Settings
  const gridColor = useLocalStorage("elec_grid_color", "#334155");
  const gridSpacing = useLocalStorage("elec_grid_spacing", 32);

  return {
    themeMode,
    baseBgStyle,
    solidColor,
    gradientColor1,
    gradientColor2,
    auroraColor1,
    auroraColor2,
    auroraColor3,
    auroraColor4,
    gridColor,
    gridSpacing,
  };
};
