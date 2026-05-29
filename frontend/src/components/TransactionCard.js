import { Pressable, StyleSheet, Text, View } from "react-native";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--/--/----";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC"
  }).format(date);
}

export default function TransactionCard({
  transaction,
  onLongPress,
  disabled = false
}) {
  const category = transaction?.category || {};
  const numericValue = Number(transaction?.value || 0);
  const isIncome = category.isIncome === true;
  const categoryColor = category.background || "#9aa8a0";
  const categoryLabel = category.displayName || category.name || "Sem categoria";

  return (
    <Pressable
      delayLongPress={250}
      disabled={disabled}
      onLongPress={() => onLongPress?.(transaction)}
      style={({ pressed }) => [
        styles.card,
        pressed ? styles.cardPressed : null,
        disabled ? styles.cardDisabled : null
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.detailsColumn}>
          <Text numberOfLines={2} style={styles.description}>
            {transaction?.description || "Sem descricao"}
          </Text>

          <View style={styles.categoryRow}>
            <View
              style={[
                styles.categoryColorIndicator,
                {
                  backgroundColor: categoryColor
                }
              ]}
            />
            <Text numberOfLines={1} style={styles.categoryText}>
              {categoryLabel}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.valueText,
            isIncome ? styles.incomeValueText : styles.expenseValueText
          ]}
        >
          {isIncome ? "+" : "-"}
          {formatCurrency(numericValue)}
        </Text>
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.dateText}>{formatDate(transaction?.date)}</Text>
        <Text style={styles.longPressHint}>Toque longo para opcoes</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#d6dfd9",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    padding: 18
  },
  cardPressed: {
    opacity: 0.88
  },
  cardDisabled: {
    opacity: 0.55
  },
  topRow: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between"
  },
  detailsColumn: {
    flex: 1
  },
  description: {
    color: "#112018",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10
  },
  categoryRow: {
    alignItems: "center",
    flexDirection: "row"
  },
  categoryColorIndicator: {
    borderRadius: 6,
    height: 12,
    marginRight: 8,
    width: 12
  },
  categoryText: {
    color: "#516059",
    flex: 1,
    fontSize: 14,
    fontWeight: "600"
  },
  valueText: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "right"
  },
  incomeValueText: {
    color: "#1c7c54"
  },
  expenseValueText: {
    color: "#b3261e"
  },
  bottomRow: {
    alignItems: "center",
    borderTopColor: "#edf2ee",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 14
  },
  dateText: {
    color: "#516059",
    fontSize: 14
  },
  longPressHint: {
    color: "#7a8480",
    fontSize: 12,
    textAlign: "right"
  }
});
