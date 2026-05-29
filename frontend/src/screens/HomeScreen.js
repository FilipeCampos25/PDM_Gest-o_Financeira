import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useIsFocused } from "@react-navigation/native";

import api from "../api/client";
import { useAuth } from "../contexts/AuthContext";

function getRequestErrorMessage(error) {
  return error.response?.data?.error || "Nao foi possivel carregar os dados.";
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

function sumTransactionsByType(transactions, isIncome) {
  return transactions.reduce((total, transaction) => {
    if (transaction.category?.isIncome !== isIncome) {
      return total;
    }

    return total + Number(transaction.value || 0);
  }, 0);
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

function ShortcutButton({ label, onPress, variant = "default" }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.shortcutButton,
        variant === "logout" ? styles.logoutButton : null,
        pressed ? styles.shortcutButtonPressed : null
      ]}
    >
      <Text
        style={[
          styles.shortcutButtonText,
          variant === "logout" ? styles.logoutButtonText : null
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function HomeScreen({ navigation }) {
  const isFocused = useIsFocused();
  const { user, signOut } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadTransactions() {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await api.get("/transactions");

        if (isActive) {
          setTransactions(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(getRequestErrorMessage(error));
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    if (isFocused) {
      loadTransactions();
    }

    return () => {
      isActive = false;
    };
  }, [isFocused]);

  const totalIncome = sumTransactionsByType(transactions, true);
  const totalExpense = sumTransactionsByType(transactions, false);
  const currentBalance = totalIncome - totalExpense;

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.greeting}>Bem-vindo, {user?.name || "Usuario"}</Text>
        <Text style={styles.subtitle}>
          Acompanhe seu saldo e acesse as principais areas do app.
        </Text>
      </View>

      {loading ? (
        <View style={styles.feedbackCard}>
          <ActivityIndicator size="large" color="#1c7c54" />
          <Text style={styles.feedbackText}>Carregando transacoes...</Text>
        </View>
      ) : (
        <>
          {!!errorMessage && (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Nao foi possivel atualizar a Home.</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Visao geral</Text>
            <SummaryCard
              label="Saldo atual"
              value={formatCurrency(currentBalance)}
              variant="balance"
            />
            <View style={styles.summaryGrid}>
              <SummaryCard
                label="Total de receitas"
                value={formatCurrency(totalIncome)}
                variant="income"
              />
              <SummaryCard
                label="Total de despesas"
                value={formatCurrency(totalExpense)}
                variant="expense"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Atalhos</Text>
            <View style={styles.shortcutsGrid}>
              <ShortcutButton
                label="Transacoes"
                onPress={() => navigation.navigate("Transactions")}
              />
              <ShortcutButton
                label="Resumo"
                onPress={() => navigation.navigate("Summary")}
              />
              <ShortcutButton
                label="Categorias"
                onPress={() => navigation.navigate("Categories")}
              />
              <ShortcutButton
                label="Sair"
                onPress={signOut}
                variant="logout"
              />
            </View>
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
    padding: 24,
    marginBottom: 20
  },
  greeting: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8
  },
  subtitle: {
    color: "#c7d5cd",
    fontSize: 15,
    lineHeight: 21
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
  errorCard: {
    backgroundColor: "#fdecec",
    borderRadius: 16,
    marginBottom: 20,
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
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    color: "#112018",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 12
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d6dfd9",
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
  shortcutsGrid: {
    gap: 12
  },
  shortcutButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#d6dfd9",
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: 16
  },
  shortcutButtonPressed: {
    opacity: 0.82
  },
  shortcutButtonText: {
    color: "#112018",
    fontSize: 16,
    fontWeight: "600"
  },
  logoutButton: {
    backgroundColor: "#112018",
    borderColor: "#112018"
  },
  logoutButtonText: {
    color: "#ffffff"
  }
});
