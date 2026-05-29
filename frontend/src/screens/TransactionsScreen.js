import { useEffect, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import api from "../api/client";
import TransactionCard from "../components/TransactionCard";
import TransactionModal from "../components/TransactionModal";

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

export default function TransactionsScreen() {
  const isFocused = useIsFocused();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [filterError, setFilterError] = useState("");
  const [filterValues, setFilterValues] = useState(getCurrentFilterValues);
  const [appliedFilter, setAppliedFilter] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState(null);

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
        getRequestErrorMessage(error, "Nao foi possivel carregar as transacoes.")
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

  function handleOpenCreateModal() {
    setSelectedTransaction(null);
    setModalError("");
    setModalVisible(true);
  }

  function handleOpenEditModal(transaction) {
    setSelectedTransaction(transaction);
    setModalError("");
    setModalVisible(true);
  }

  function handleCloseModal() {
    if (modalSubmitting) {
      return;
    }

    setModalVisible(false);
    setSelectedTransaction(null);
    setModalError("");
  }

  async function handleSaveTransaction(payload) {
    try {
      setModalSubmitting(true);
      setModalError("");

      if (selectedTransaction?.id) {
        await api.put(`/transactions/${selectedTransaction.id}`, payload);
      } else {
        await api.post("/transactions", payload);
      }

      setModalVisible(false);
      setSelectedTransaction(null);
      await loadTransactions(appliedFilter);
    } catch (error) {
      setModalError(
        getRequestErrorMessage(error, "Nao foi possivel salvar a transacao.")
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function deleteTransaction(transaction) {
    try {
      setDeletingTransactionId(transaction.id);

      await api.delete(`/transactions/${transaction.id}`);
      await loadTransactions(appliedFilter);
    } catch (error) {
      Alert.alert(
        "Erro",
        getRequestErrorMessage(error, "Nao foi possivel excluir a transacao.")
      );
    } finally {
      setDeletingTransactionId(null);
    }
  }

  function handleTransactionLongPress(transaction) {
    Alert.alert("Opcoes", "Escolha uma acao para esta transacao.", [
      {
        text: "Editar",
        onPress: () => handleOpenEditModal(transaction)
      },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () =>
          Alert.alert(
            "Excluir transacao",
            `Deseja excluir "${transaction.description}"?`,
            [
              {
                text: "Cancelar",
                style: "cancel"
              },
              {
                text: "Excluir",
                style: "destructive",
                onPress: () => deleteTransaction(transaction)
              }
            ]
          )
      },
      {
        text: "Cancelar",
        style: "cancel"
      }
    ]);
  }

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionCard
            disabled={deletingTransactionId === item.id}
            onLongPress={handleTransactionLongPress}
            transaction={item}
          />
        )}
        refreshControl={
          <RefreshControl
            onRefresh={() => loadTransactions(appliedFilter, { silent: true })}
            refreshing={refreshing}
            tintColor="#1c7c54"
          />
        }
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={styles.hero}>
              <Text style={styles.title}>Transacoes</Text>
              <Text style={styles.subtitle}>
                Consulte seus lancamentos, filtre por periodo e gerencie tudo em
                um so lugar.
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
                <FilterButton
                  label="Limpar"
                  onPress={handleClearFilter}
                  variant="secondary"
                />
              </View>

              <Text style={styles.filterStatus}>
                {appliedFilter
                  ? `Filtro ativo: ${String(appliedFilter.month).padStart(2, "0")}/${appliedFilter.year}`
                  : "Sem filtro ativo. Exibindo todas as transacoes."}
              </Text>
            </View>

            <Pressable
              onPress={handleOpenCreateModal}
              style={({ pressed }) => [
                styles.addButton,
                pressed ? styles.addButtonPressed : null
              ]}
            >
              <Text style={styles.addButtonText}>Adicionar transacao</Text>
            </Pressable>

            {!!errorMessage && (
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>
                  Nao foi possivel carregar as transacoes.
                </Text>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {loading ? (
              <View style={styles.feedbackCard}>
                <ActivityIndicator color="#1c7c54" size="large" />
                <Text style={styles.feedbackText}>Carregando transacoes...</Text>
              </View>
            ) : null}

            {!loading ? (
              <Text style={styles.listHint}>
                Toque longo em uma transacao para editar ou excluir.
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nenhuma transacao encontrada.</Text>
              <Text style={styles.emptyText}>
                Ajuste os filtros ou cadastre uma nova transacao.
              </Text>
            </View>
          ) : null
        }
      />

      <TransactionModal
        onClose={handleCloseModal}
        onSave={handleSaveTransaction}
        submitError={modalError}
        submitting={modalSubmitting}
        transaction={selectedTransaction}
        visible={modalVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef3ef"
  },
  listContent: {
    padding: 20,
    paddingBottom: 32
  },
  headerContent: {
    marginBottom: 12
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
  sectionTitle: {
    color: "#112018",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14
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
  addButton: {
    alignItems: "center",
    backgroundColor: "#1c7c54",
    borderRadius: 14,
    justifyContent: "center",
    marginBottom: 16,
    minHeight: 54
  },
  addButtonPressed: {
    opacity: 0.85
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700"
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
    marginBottom: 16,
    padding: 24
  },
  feedbackText: {
    color: "#516059",
    fontSize: 15,
    marginTop: 12
  },
  listHint: {
    color: "#516059",
    fontSize: 14,
    marginBottom: 12
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
