export const CATEGORY_COLOR_OPTIONS = [
  { label: "Verde", value: "#1c7c54" },
  { label: "Azul", value: "#2f6db3" },
  { label: "Vermelho", value: "#b3261e" },
  { label: "Amarelo", value: "#d99a21" },
  { label: "Roxo", value: "#6d5bd0" },
  { label: "Turquesa", value: "#00838f" },
  { label: "Rosa", value: "#c2185b" },
  { label: "Cinza", value: "#60746a" }
];

export function getCategoryColorLabel(value) {
  const color = CATEGORY_COLOR_OPTIONS.find((option) => option.value === value);

  return color?.label || "Cor personalizada";
}
