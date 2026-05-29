import { useEffect, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from "react-native";

import api from "../api/client";
import CategoryModal from "../components/CategoryModal";
import { getCategoryColorLabel } from "../constants/categoryColors";
import { getCategoryIconLabel } from "../constants/categoryIcons";

const DEFAULT_CATEGORY_DELETE_MESSAGE =
  "Categorias padrão não podem ser excluídas";

function getRequestErrorMessage(error, fallbackMessage) {
  return error.response?.data?.error || fallbackMessage;
}

function CategoryCard({
  category,
  disabled = false,
  onEdit,
  onDelete
}) {
  return (
    <View style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <View
          style={[
            styles.categoryIcon,
            { backgroundColor: category.background || "#9aa8a0" }
          ]}
        >
          <MaterialIcons
            color="#ffffff"
            name={category.icon || "category"}
            size={24}
          />
        </View>

        <View style={styles.categoryTitleGroup}>
          <Text style={styles.categoryName}>
            {category.displayName || category.name}
          </Text>
          <Text style={styles.categoryInternalName}>{category.name}</Text>
        </View>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Cor</Text>
          <View style={styles.backgroundRow}>
            <View
              style={[
                styles.backgroundSwatch,
                { backgroundColor: category.background || "#9aa8a0" }
              ]}
            />
            <Text style={styles.detailValue}>
              {getCategoryColorLabel(category.background)}
            </Text>
          </View>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Icone</Text>
          <Text style={styles.detailValue}>{getCategoryIconLabel(category.icon)}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Tipo</Text>
          <Text style={styles.detailValue}>
            {category.isIncome ? "Receita" : "Despesa"}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Origem</Text>
          <Text style={styles.detailValue}>
            {category.isDefault ? "Padrao" : "Customizada"}
          </Text>
        </View>
      </View>

      {category.isDefault ? (
        <Text style={styles.defaultHint}>Categoria padrao do sistema</Text>
      ) : (
        <View style={styles.cardActions}>
          <Pressable
            disabled={disabled}
            onPress={() => onEdit?.(category)}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed || disabled ? styles.buttonPressed : null
            ]}
          >
            <Text style={styles.secondaryButtonText}>Editar</Text>
          </Pressable>

          <Pressable
            disabled={disabled}
            onPress={() => onDelete?.(category)}
            style={({ pressed }) => [
              styles.dangerButton,
              pressed || disabled ? styles.buttonPressed : null
            ]}
          >
            <Text style={styles.dangerButtonText}>Excluir</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function CategoriesScreen() {
  const isFocused = useIsFocused();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);

  async function loadCategories(options = {}) {
    const silent = options.silent === true;

    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      const response = await api.get("/categories");

      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setErrorMessage(
        getRequestErrorMessage(error, "Nao foi possivel carregar as categorias.")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (isFocused) {
      loadCategories();
    }
  }, [isFocused]);

  function handleOpenCreateModal() {
    setSelectedCategory(null);
    setModalError("");
    setModalVisible(true);
  }

  function handleOpenEditModal(category) {
    if (category.isDefault) {
      Alert.alert("Categoria padrao", "Categorias padrao nao podem ser editadas.");
      return;
    }

    setSelectedCategory(category);
    setModalError("");
    setModalVisible(true);
  }

  function handleCloseModal() {
    if (modalSubmitting) {
      return;
    }

    setModalVisible(false);
    setSelectedCategory(null);
    setModalError("");
  }

  async function handleSaveCategory(payload) {
    try {
      setModalSubmitting(true);
      setModalError("");

      if (selectedCategory?.id) {
        await api.put(`/categories/${selectedCategory.id}`, payload);
      } else {
        await api.post("/categories", payload);
      }

      setModalVisible(false);
      setSelectedCategory(null);
      await loadCategories();
    } catch (error) {
      setModalError(
        getRequestErrorMessage(error, "Nao foi possivel salvar a categoria.")
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function deleteCategory(category) {
    if (category.isDefault) {
      Alert.alert("Erro", DEFAULT_CATEGORY_DELETE_MESSAGE);
      return;
    }

    try {
      setDeletingCategoryId(category.id);

      await api.delete(`/categories/${category.id}`);
      await loadCategories();
    } catch (error) {
      Alert.alert(
        "Erro",
        getRequestErrorMessage(error, "Nao foi possivel excluir a categoria.")
      );
    } finally {
      setDeletingCategoryId(null);
    }
  }

  function handleDeleteCategory(category) {
    if (category.isDefault) {
      Alert.alert("Erro", DEFAULT_CATEGORY_DELETE_MESSAGE);
      return;
    }

    Alert.alert(
      "Excluir categoria",
      `Deseja excluir "${category.displayName || category.name}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => deleteCategory(category)
        }
      ]
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CategoryCard
            category={item}
            disabled={deletingCategoryId === item.id}
            onDelete={handleDeleteCategory}
            onEdit={handleOpenEditModal}
          />
        )}
        refreshControl={
          <RefreshControl
            onRefresh={() => loadCategories({ silent: true })}
            refreshing={refreshing}
            tintColor="#1c7c54"
          />
        }
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={styles.hero}>
              <Text style={styles.title}>Categorias</Text>
              <Text style={styles.subtitle}>
                Adicione, edite ou exclua categorias customizadas. As categorias
                padrao ficam protegidas.
              </Text>
            </View>

            <Pressable
              onPress={handleOpenCreateModal}
              style={({ pressed }) => [
                styles.addButton,
                pressed ? styles.addButtonPressed : null
              ]}
            >
              <Text style={styles.addButtonText}>Adicionar categoria</Text>
            </Pressable>

            {!!errorMessage && (
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>
                  Nao foi possivel carregar as categorias.
                </Text>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {loading ? (
              <View style={styles.feedbackCard}>
                <ActivityIndicator color="#1c7c54" size="large" />
                <Text style={styles.feedbackText}>Carregando categorias...</Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nenhuma categoria encontrada.</Text>
              <Text style={styles.emptyText}>
                Cadastre uma categoria customizada para organizar seus lancamentos.
              </Text>
            </View>
          ) : null
        }
      />

      <CategoryModal
        category={selectedCategory}
        onClose={handleCloseModal}
        onSave={handleSaveCategory}
        submitError={modalError}
        submitting={modalSubmitting}
        visible={modalVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#eef3ef",
    flex: 1
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
  categoryCard: {
    backgroundColor: "#ffffff",
    borderColor: "#d6dfd9",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16
  },
  categoryHeader: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 14
  },
  categoryIcon: {
    alignItems: "center",
    borderRadius: 18,
    height: 46,
    justifyContent: "center",
    marginRight: 12,
    width: 46
  },
  categoryTitleGroup: {
    flex: 1
  },
  categoryName: {
    color: "#112018",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 3
  },
  categoryInternalName: {
    color: "#516059",
    fontSize: 13
  },
  detailsGrid: {
    gap: 10,
    marginBottom: 14
  },
  detailItem: {
    backgroundColor: "#f6f8f7",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  detailLabel: {
    color: "#516059",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase"
  },
  detailValue: {
    color: "#112018",
    fontSize: 14,
    fontWeight: "600"
  },
  backgroundRow: {
    alignItems: "center",
    flexDirection: "row"
  },
  backgroundSwatch: {
    borderColor: "#ffffff",
    borderRadius: 6,
    borderWidth: 1,
    height: 18,
    marginRight: 8,
    width: 18
  },
  defaultHint: {
    color: "#516059",
    fontSize: 13,
    fontWeight: "600"
  },
  cardActions: {
    flexDirection: "row",
    gap: 10
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#f2f5f3",
    borderColor: "#d5ddd8",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 44
  },
  dangerButton: {
    alignItems: "center",
    backgroundColor: "#fdecec",
    borderRadius: 12,
    flex: 1,
    justifyContent: "center",
    minHeight: 44
  },
  buttonPressed: {
    opacity: 0.82
  },
  secondaryButtonText: {
    color: "#203229",
    fontSize: 14,
    fontWeight: "700"
  },
  dangerButtonText: {
    color: "#b3261e",
    fontSize: 14,
    fontWeight: "700"
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
