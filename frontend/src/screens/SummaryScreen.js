import { useEffect, useMemo, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from "react-native";
import { PieChart } from "react-native-chart-kit";

import api from "../api/client";

const FALLBACK_CATEGORY_COLORS = [
  "#1c7c54",
  "#b3261e",
  "#2f6db3",
  "#b7791f",
  "#7b61ff",
  "#00838f",
  "#c2185b",
  "#5d6d1e"
];

function getRequestErrorMessage(error, fallbackMessage) {
  return error.response?.data?.error || fallbackMessage;
}

function getCurrentFilterValues() {
  const now = new Date();

  return {
    month: String(now.getMonth() + 1).padStart(2, "0"),
    year: String(now.getFullYear())
  };
}

function normalizeDigits(value, maxLength) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function validateFilterValues({ month, year }) {
  if (!month || !year) {
    return "Informe mes e ano para aplicar o filtro.";
  }

  const parsedMonth = Number(month);
  const parsedYear = Number(year);

  if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    return "O mes deve estar entre 1 e 12.";
  }

  if (!/^\d{4}$/.test(year) || parsedYear < 1) {
    return "Informe um ano valido com quatro digitos.";
  }

  return "";
}

function buildTransactionsParams(filter) {
  if (!filter) {
    return undefined;
  }

  return {
    month: filter.month,
    year: filter.year
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

function isIncomeTransaction(transaction) {
  return transaction?.category?.isIncome === true;
}

function calculateTotals(transactions) {
  return transactions.reduce(
    (totals, transaction) => {
      const value = Number(transaction?.value || 0);

      if (isIncomeTransaction(transaction)) {
        totals.income += value;
      } else {
        totals.expense += value;
      }

      totals.balance = totals.income - totals.expense;
      return totals;
    },
    {
      income: 0,
      expense: 0,
      balance: 0
    }
  );
}

function getCategoryLabel(category) {
  return category?.displayName || category?.name || "Sem categoria";
}

function buildExpenseChartData(transactions) {
  const groupedExpenses = new Map();

  transactions.forEach((transaction) => {
    if (isIncomeTransaction(transaction)) {
      return;
    }

    const category = transaction?.category || {};
    const categoryName = getCategoryLabel(category);
    const currentExpense = groupedExpenses.get(categoryName) || {
      name: categoryName,
      value: 0,
      color: category.background
    };

    currentExpense.value += Number(transaction?.value || 0);
    currentExpense.color = currentExpense.color || category.background;
    groupedExpenses.set(categoryName, currentExpense);
  });

  return Array.from(groupedExpenses.values()).map((expense, index) => ({
    name: expense.name,
    amount: expense.value,
    color: expense.color || FALLBACK_CATEGORY_COLORS[index % FALLBACK_CATEGORY_COLORS.length],
    legendFontColor: "#203229",
    legendFontSize: 13
  }));
}

function FilterButton({ label, onPress, variant = "primary" }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterButton,
        variant === "secondary" ? styles.secondaryFilterButton : null,
        pressed ? styles.filterButtonPressed : null
      ]}
    >
      <Text
        style={[
          styles.filterButtonText,
          variant === "secondary" ? styles.secondaryFilterButtonText : null
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SummaryCard({ label, value, variant = "default" }) {
  return (
    <View
      style={[
        styles.summaryCard,
        variant === "balance" ? styles.balanceCard : null,
        variant === "income" ? styles.incomeCard : null,
        variant === "expense" ? styles.expenseCard : null
      ]}
    >
      <Text
        style={[
          styles.summaryLabel,
          variant === "balance" ? styles.balanceCardText : null
        ]}
      >
        {label}
      </Text>
      <Text
        adjustsFontSizeToFit
        numberOfLines={1}
        style={[
          styles.summaryValue,
          variant === "balance" ? styles.balanceCardText : null
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export default function SummaryScreen() {
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [filterError, setFilterError] = useState("");
  const [filterValues, setFilterValues] = useState(getCurrentFilterValues);
  const [appliedFilter, setAppliedFilter] = useState(null);

  async function loadTransactions(filter = appliedFilter, options = {}) {
    const silent = options.silent === true;

    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      const response = await api.get("/transactions", {
        params: buildTransactionsParams(filter)
      });

      setTransactions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setErrorMessage(
        getRequestErrorMessage(error, "Nao foi possivel carregar o resumo financeiro.")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (isFocused) {
      loadTransactions(appliedFilter);
    }
  }, [appliedFilter, isFocused]);

  const totals = useMemo(() => calculateTotals(transactions), [transactions]);
  const chartData = useMemo(() => buildExpenseChartData(transactions), [transactions]);
  const chartWidth = Math.max(300, Math.min(width - 40, 420));

  function handleMonthChange(value) {
    setFilterValues((currentValues) => ({
      ...currentValues,
      month: normalizeDigits(value, 2)
    }));
    setFilterError("");
  }

  function handleYearChange(value) {
    setFilterValues((currentValues) => ({
      ...currentValues,
      year: normalizeDigits(value, 4)
    }));
    setFilterError("");
  }

  function handleApplyFilter() {
    const validationMessage = validateFilterValues(filterValues);

    if (validationMessage) {
      setFilterError(validationMessage);
      return;
    }

    const normalizedFilter = {
      month: Number(filterValues.month),
      year: Number(filterValues.year)
    };

    setFilterValues({
      month: String(normalizedFilter.month).padStart(2, "0"),
      year: String(normalizedFilter.year)
    });
    setAppliedFilter(normalizedFilter);
  }

  function handleClearFilter() {
    setFilterError("");
    setFilterValues(getCurrentFilterValues());
    setAppliedFilter(null);
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          onRefresh={() => loadTransactions(appliedFilter, { silent: true })}
          refreshing={refreshing}
          tintColor="#1c7c54"
        />
      }
      style={styles.container}
    >
      <View style={styles.hero}>
        <Text style={styles.title}>Resumo financeiro</Text>
        <Text style={styles.subtitle}>
          Veja receitas, despesas, saldo e a distribuicao dos gastos por categoria.
        </Text>
      </View>

      <View style={styles.filterCard}>
        <Text style={styles.sectionTitle}>Filtros</Text>

        <View style={styles.filterInputsRow}>
          <View style={styles.filterField}>
            <Text style={styles.fieldLabel}>Mes</Text>
            <TextInput
              keyboardType="number-pad"
              maxLength={2}
              onChangeText={handleMonthChange}
              placeholder="04"
              placeholderTextColor="#7a8480"
              style={styles.input}
              value={filterValues.month}
            />
          </View>

          <View style={styles.filterField}>
            <Text style={styles.fieldLabel}>Ano</Text>
            <TextInput
              keyboardType="number-pad"
              maxLength={4}
              onChangeText={handleYearChange}
              placeholder="2026"
              placeholderTextColor="#7a8480"
              style={styles.input}
              value={filterValues.year}
            />
          </View>
        </View>

        {!!filterError && <Text style={styles.fieldError}>{filterError}</Text>}

        <View style={styles.filterActions}>
          <FilterButton label="Aplicar filtro" onPress={handleApplyFilter} />
          <FilterButton label="Limpar" onPress={handleClearFilter} variant="secondary" />
        </View>

        <Text style={styles.filterStatus}>
          {appliedFilter
            ? `Filtro ativo: ${String(appliedFilter.month).padStart(2, "0")}/${appliedFilter.year}`
            : "Sem filtro ativo. Considerando todas as transacoes."}
        </Text>
      </View>

      {!!errorMessage && (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Nao foi possivel atualizar o resumo.</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.feedbackCard}>
          <ActivityIndicator color="#1c7c54" size="large" />
          <Text style={styles.feedbackText}>Carregando resumo...</Text>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Totais</Text>
            <SummaryCard
              label="Saldo"
              value={formatCurrency(totals.balance)}
              variant="balance"
            />
            <View style={styles.summaryGrid}>
              <SummaryCard
                label="Receitas"
                value={formatCurrency(totals.income)}
                variant="income"
              />
              <SummaryCard
                label="Despesas"
                value={formatCurrency(totals.expense)}
                variant="expense"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Despesas por categoria</Text>

            {chartData.length > 0 ? (
              <View style={styles.chartCard}>
                <PieChart
                  accessor="amount"
                  backgroundColor="transparent"
                  chartConfig={{
                    color: () => "#203229"
                  }}
                  data={chartData}
                  hasLegend
                  height={220}
                  paddingLeft="6"
                  width={chartWidth}
                />
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Sem despesas neste periodo.</Text>
                <Text style={styles.emptyText}>
                  Quando houver despesas, elas aparecerao agrupadas por categoria.
                </Text>
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef3ef"
  },
  content: {
    padding: 20,
    paddingBottom: 32
  },
  hero: {
    backgroundColor: "#112018",
    borderRadius: 20,
    marginBottom: 16,
    padding: 24
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8
  },
  subtitle: {
    color: "#c7d5cd",
    fontSize: 15,
    lineHeight: 22
  },
  filterCard: {
    backgroundColor: "#ffffff",
    borderColor: "#d6dfd9",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    color: "#112018",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12
  },
  filterInputsRow: {
    flexDirection: "row",
    gap: 12
  },
  filterField: {
    flex: 1
  },
  fieldLabel: {
    color: "#203229",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8
  },
  input: {
    backgroundColor: "#f6f8f7",
    borderColor: "#d5ddd8",
    borderRadius: 12,
    borderWidth: 1,
    color: "#112018",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 13
  },
  fieldError: {
    color: "#b3261e",
    fontSize: 13,
    marginTop: 8
  },
  filterActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14
  },
  filterButton: {
    alignItems: "center",
    backgroundColor: "#1c7c54",
    borderRadius: 12,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 14
  },
  secondaryFilterButton: {
    backgroundColor: "#f2f5f3",
    borderColor: "#d5ddd8",
    borderWidth: 1
  },
  filterButtonPressed: {
    opacity: 0.85
  },
  filterButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700"
  },
  secondaryFilterButtonText: {
    color: "#203229"
  },
  filterStatus: {
    color: "#516059",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14
  },
  errorCard: {
    backgroundColor: "#fdecec",
    borderRadius: 16,
    marginBottom: 16,
    padding: 16
  },
  errorTitle: {
    color: "#8f1d1d",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6
  },
  errorText: {
    color: "#b3261e",
    fontSize: 14,
    lineHeight: 20
  },
  feedbackCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 28
  },
  feedbackText: {
    color: "#516059",
    fontSize: 15,
    marginTop: 12
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 12
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    borderColor: "#d6dfd9",
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    minHeight: 112,
    padding: 18
  },
  balanceCard: {
    backgroundColor: "#1c7c54",
    borderColor: "#1c7c54",
    marginBottom: 12
  },
  incomeCard: {
    backgroundColor: "#eef8f1"
  },
  expenseCard: {
    backgroundColor: "#fff3f1"
  },
  summaryLabel: {
    color: "#516059",
    fontSize: 14,
    marginBottom: 10
  },
  summaryValue: {
    color: "#112018",
    fontSize: 22,
    fontWeight: "700"
  },
  balanceCardText: {
    color: "#ffffff"
  },
  chartCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#d6dfd9",
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    paddingVertical: 14
  },
  emptyCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#d6dfd9",
    borderRadius: 18,
    borderWidth: 1,
    padding: 24
  },
  emptyTitle: {
    color: "#112018",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center"
  },
  emptyText: {
    color: "#516059",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  }
});
