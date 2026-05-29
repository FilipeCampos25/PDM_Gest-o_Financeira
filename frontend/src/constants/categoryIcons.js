export const CATEGORY_ICON_OPTIONS = [
  { label: "Categoria", value: "category" },
  { label: "Receita", value: "attach-money" },
  { label: "Alimentacao", value: "restaurant" },
  { label: "Transporte", value: "directions-car" },
  { label: "Lazer", value: "sports-esports" },
  { label: "Educacao", value: "school" },
  { label: "Saude", value: "favorite" },
  { label: "Casa", value: "home" },
  { label: "Compras", value: "shopping-cart" },
  { label: "Trabalho", value: "work" }
];

export function getCategoryIconLabel(value) {
  const icon = CATEGORY_ICON_OPTIONS.find((option) => option.value === value);

  return icon?.label || "Categoria";
}
