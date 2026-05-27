import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import api from "../api/client";

function getRequestErrorMessage(error, fallbackMessage) {
  return error.response?.data?.error || fallbackMessage;
}

function formatInputDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function normalizeCurrencyInput(value) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return Number.NaN;
  }

  if (trimmedValue.includes(",") && trimmedValue.includes(".")) {
    return Number(trimmedValue.replace(/\./g, "").replace(",", "."));
  }

  return Number(trimmedValue.replace(",", "."));
}

function isValidDateInput(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.toISOString().slice(0, 10) === value;
}

function buildInitialValues(transaction) {
  return {
    description: transaction?.description || "",
    value: transaction?.value ? String(transaction.value) : "",
    date: formatInputDate(transaction?.date),
    categoryId: transaction?.categoryId || transaction?.category?.id || ""
  };
}

function validateFormValues(values) {
  const nextErrors = {};
  const parsedValue = normalizeCurrencyInput(values.value);

  if (!values.description.trim()) {
    nextErrors.description = "Informe a descricao.";
  }

  if (Number.isNaN(parsedValue) || parsedValue <= 0) {
    nextErrors.value = "Informe um valor maior que zero.";
  }

  if (!isValidDateInput(values.date)) {
    nextErrors.date = "Use uma data valida no formato YYYY-MM-DD.";
  }

  if (!values.categoryId) {
    nextErrors.categoryId = "Selecione uma categoria.";
  }

  return nextErrors;
}

export default function TransactionModal({
  visible = false,
  transaction = null,
  submitting = false,
  submitError = "",
  onClose,
  onSave
}) {
  const [formValues, setFormValues] = useState(buildInitialValues(transaction));
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState("");

  useEffect(() => {
    if (!visible) {
      return;
    }

    setFormValues(buildInitialValues(transaction));
    setErrors({});
  }, [transaction, visible]);

  useEffect(() => {
    let isActive = true;

    async function loadCategories() {
      try {
        setLoadingCategories(true);
        setCategoriesError("");

        const response = await api.get("/categories");

        if (isActive) {
          setCategories(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        if (isActive) {
          setCategoriesError(
            getRequestErrorMessage(
              error,
              "Nao foi possivel carregar as categorias."
            )
          );
        }
      } finally {
        if (isActive) {
          setLoadingCategories(false);
        }
      }
    }

    if (visible) {
      loadCategories();
    }

    return () => {
      isActive = false;
    };
  }, [visible]);

  function handleFieldChange(field, value) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined
    }));
  }

  function handleSubmit() {
    const nextErrors = validateFormValues(formValues);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSave?.({
      description: formValues.description.trim(),
      value: normalizeCurrencyInput(formValues.value),
      date: formValues.date,
      categoryId: formValues.categoryId
    });
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <Pressable onPress={onClose} style={styles.backdrop} />

        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {transaction ? "Editar transacao" : "Nova transacao"}
            </Text>
            <Pressable
              disabled={submitting}
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed ? styles.closeButtonPressed : null
              ]}
            >
              <Text style={styles.closeButtonText}>Fechar</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {!!submitError && <Text style={styles.submitError}>{submitError}</Text>}
            {!!categoriesError && (
              <Text style={styles.submitError}>{categoriesError}</Text>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Descricao</Text>
              <TextInput
                editable={!submitting}
                onChangeText={(value) => handleFieldChange("description", value)}
                placeholder="Ex: Salario de abril"
                placeholderTextColor="#7a8480"
                style={[
                  styles.input,
                  errors.description ? styles.inputError : null
                ]}
                value={formValues.description}
              />
              {!!errors.description && (
                <Text style={styles.fieldError}>{errors.description}</Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Valor</Text>
              <TextInput
                editable={!submitting}
                keyboardType="decimal-pad"
                onChangeText={(value) => handleFieldChange("value", value)}
                placeholder="0,00"
                placeholderTextColor="#7a8480"
                style={[styles.input, errors.value ? styles.inputError : null]}
                value={formValues.value}
              />
              {!!errors.value && <Text style={styles.fieldError}>{errors.value}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Data</Text>
              <TextInput
                editable={!submitting}
                onChangeText={(value) => handleFieldChange("date", value)}
                placeholder="2026-04-29"
                placeholderTextColor="#7a8480"
                style={[styles.input, errors.date ? styles.inputError : null]}
                value={formValues.date}
              />
              {!!errors.date && <Text style={styles.fieldError}>{errors.date}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Categoria</Text>

              {loadingCategories ? (
                <View style={styles.categoryLoading}>
                  <ActivityIndicator color="#1c7c54" />
                  <Text style={styles.categoryLoadingText}>
                    Carregando categorias...
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.categoriesContainer,
                    errors.categoryId ? styles.inputError : null
                  ]}
                >
                  {categories.length > 0 ? (
                    categories.map((category) => {
                      const isSelected = formValues.categoryId === category.id;

                      return (
                        <Pressable
                          disabled={submitting}
                          key={category.id}
                          onPress={() => handleFieldChange("categoryId", category.id)}
                          style={({ pressed }) => [
                            styles.categoryOption,
                            isSelected ? styles.categoryOptionSelected : null,
                            pressed ? styles.categoryOptionPressed : null
                          ]}
                        >
                          <View style={styles.categoryOptionContent}>
                            <View
                              style={[
                                styles.categoryDot,
                                {
                                  backgroundColor: category.background || "#9aa8a0"
                                }
                              ]}
                            />
                            <View style={styles.categoryTextGroup}>
                              <Text style={styles.categoryName}>
                                {category.displayName || category.name}
                              </Text>
                              <Text style={styles.categoryType}>
                                {category.isIncome ? "Receita" : "Despesa"}
                              </Text>
                            </View>
                          </View>

                          {isSelected ? (
                            <Text style={styles.categorySelectedLabel}>
                              Selecionada
                            </Text>
                          ) : null}
                        </Pressable>
                      );
                    })
                  ) : (
                    <Text style={styles.emptyCategoriesText}>
                      Nenhuma categoria disponivel.
                    </Text>
                  )}
                </View>
              )}

              {!!errors.categoryId && (
                <Text style={styles.fieldError}>{errors.categoryId}</Text>
              )}
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                disabled={submitting}
                onPress={onClose}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed ? styles.buttonPressed : null
                ]}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </Pressable>

              <Pressable
                disabled={submitting || loadingCategories}
                onPress={handleSubmit}
                style={({ pressed }) => [
                  styles.primaryButton,
                  (pressed || submitting) ? styles.buttonPressed : null
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Salvar</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(17, 32, 24, 0.36)",
    flex: 1,
    justifyContent: "flex-end"
  },
  backdrop: {
    flex: 1
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    minHeight: "62%",
    paddingHorizontal: 20,
    paddingTop: 20
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  title: {
    color: "#112018",
    fontSize: 22,
    fontWeight: "700"
  },
  closeButton: {
    paddingVertical: 6
  },
  closeButtonPressed: {
    opacity: 0.75
  },
  closeButtonText: {
    color: "#1c7c54",
    fontSize: 15,
    fontWeight: "700"
  },
  content: {
    paddingBottom: 24
  },
  submitError: {
    backgroundColor: "#fdecec",
    borderRadius: 12,
    color: "#b3261e",
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  field: {
    marginBottom: 18
  },
  label: {
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
  inputError: {
    borderColor: "#d64545"
  },
  fieldError: {
    color: "#b3261e",
    fontSize: 13,
    marginTop: 6
  },
  categoryLoading: {
    alignItems: "center",
    backgroundColor: "#f6f8f7",
    borderColor: "#d5ddd8",
    borderRadius: 12,
    borderWidth: 1,
    padding: 18
  },
  categoryLoadingText: {
    color: "#516059",
    fontSize: 14,
    marginTop: 10
  },
  categoriesContainer: {
    backgroundColor: "#f6f8f7",
    borderColor: "#d5ddd8",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden"
  },
  categoryOption: {
    alignItems: "center",
    borderBottomColor: "#e6ece8",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14
  },
  categoryOptionPressed: {
    opacity: 0.85
  },
  categoryOptionSelected: {
    backgroundColor: "#e9f5ee"
  },
  categoryOptionContent: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    marginRight: 12
  },
  categoryDot: {
    borderRadius: 7,
    height: 14,
    marginRight: 10,
    width: 14
  },
  categoryTextGroup: {
    flex: 1
  },
  categoryName: {
    color: "#112018",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2
  },
  categoryType: {
    color: "#516059",
    fontSize: 13
  },
  categorySelectedLabel: {
    color: "#1c7c54",
    fontSize: 12,
    fontWeight: "700"
  },
  emptyCategoriesText: {
    color: "#516059",
    fontSize: 14,
    padding: 16,
    textAlign: "center"
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#f2f5f3",
    borderColor: "#d5ddd8",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 50
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#1c7c54",
    borderRadius: 12,
    flex: 1,
    justifyContent: "center",
    minHeight: 50
  },
  buttonPressed: {
    opacity: 0.85
  },
  secondaryButtonText: {
    color: "#203229",
    fontSize: 15,
    fontWeight: "700"
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700"
  }
});
