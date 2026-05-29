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

const MONTH_LABELS = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
];

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

function getRequestErrorMessage(error, fallbackMessage) {
  return error.response?.data?.error || fallbackMessage;
}

function formatIsoDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(value) {
  const isoDate = formatIsoDate(value);

  if (!isoDate) {
    return "";
  }

  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function normalizeCurrencyInput(value) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return Number.NaN;
  }

  if (trimmedValue.includes(",") && trimmedValue.includes(".")) {
    return Number(trimmedValue.replace(/\./g, "").replace(",", "."));
  }

  if (/^\d{1,3}(\.\d{3})+$/.test(trimmedValue)) {
    return Number(trimmedValue.replace(/\./g, ""));
  }

  return Number(trimmedValue.replace(",", "."));
}

function formatCurrencyInput(value) {
  const parsedValue = normalizeCurrencyInput(value);

  if (Number.isNaN(parsedValue)) {
    return value;
  }

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(parsedValue);
}

function normalizeDateInput(value) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  const isoMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoMatch) {
    return trimmedValue;
  }

  const brMatch = trimmedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (brMatch) {
    const [, day, month, year] = brMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const digits = trimmedValue.replace(/\D/g, "");

  if (digits.length === 8) {
    if (digits.startsWith("19") || digits.startsWith("20")) {
      return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
    }

    return `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
  }

  return trimmedValue;
}

function isValidIsoDate(value) {
  const normalizedValue = normalizeDateInput(value);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return false;
  }

  const date = new Date(`${normalizedValue}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.toISOString().slice(0, 10) === normalizedValue;
}

function normalizeText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function getCalendarMonth(value) {
  const isoDate = formatIsoDate(value);
  const date = isoDate ? new Date(`${isoDate}T00:00:00.000Z`) : new Date();

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function buildCalendarDays(monthDate) {
  const year = monthDate.getUTCFullYear();
  const month = monthDate.getUTCMonth();
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const days = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(Date.UTC(year, month, day)));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

function buildInitialValues(transaction) {
  return {
    description: transaction?.description || "",
    value: transaction?.value ? String(transaction.value) : "",
    date: formatDisplayDate(transaction?.date),
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

  if (!isValidIsoDate(values.date)) {
    nextErrors.date = "Informe uma data valida.";
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
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(getCalendarMonth(transaction?.date));

  useEffect(() => {
    if (!visible) {
      return;
    }

    setFormValues(buildInitialValues(transaction));
    setErrors({});
    setCalendarVisible(false);
    setCalendarMonth(getCalendarMonth(transaction?.date));
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
    const normalizedDate = normalizeDateInput(formValues.date);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSave?.({
      description: normalizeText(formValues.description),
      value: normalizeCurrencyInput(formValues.value),
      date: normalizedDate,
      categoryId: formValues.categoryId
    });
  }

  function handleValueBlur() {
    if (!formValues.value.trim()) {
      return;
    }

    handleFieldChange("value", formatCurrencyInput(formValues.value));
  }

  function handleDateBlur() {
    const normalizedDate = normalizeDateInput(formValues.date);

    if (!isValidIsoDate(normalizedDate)) {
      return;
    }

    handleFieldChange("date", formatDisplayDate(normalizedDate));
    setCalendarMonth(getCalendarMonth(normalizedDate));
  }

  function handleSelectCalendarDate(date) {
    const isoDate = formatIsoDate(date.toISOString());

    handleFieldChange("date", formatDisplayDate(isoDate));
    setCalendarMonth(getCalendarMonth(isoDate));
    setCalendarVisible(false);
  }

  function handleChangeCalendarMonth(offset) {
    setCalendarMonth((currentMonth) => (
      new Date(Date.UTC(
        currentMonth.getUTCFullYear(),
        currentMonth.getUTCMonth() + offset,
        1
      ))
    ));
  }

  const normalizedSelectedDate = normalizeDateInput(formValues.date);
  const calendarDays = buildCalendarDays(calendarMonth);

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
                onBlur={handleValueBlur}
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
              <View style={styles.dateInputRow}>
                <TextInput
                  editable={!submitting}
                  keyboardType="number-pad"
                  onBlur={handleDateBlur}
                  onChangeText={(value) => handleFieldChange("date", value)}
                  placeholder="29/04/2026"
                  placeholderTextColor="#7a8480"
                  style={[
                    styles.input,
                    styles.dateInput,
                    errors.date ? styles.inputError : null
                  ]}
                  value={formValues.date}
                />
                <Pressable
                  disabled={submitting}
                  onPress={() => setCalendarVisible((currentValue) => !currentValue)}
                  style={({ pressed }) => [
                    styles.calendarToggle,
                    pressed ? styles.buttonPressed : null
                  ]}
                >
                  <Text style={styles.calendarToggleText}>Agenda</Text>
                </Pressable>
              </View>
              {!!errors.date && <Text style={styles.fieldError}>{errors.date}</Text>}
              {calendarVisible ? (
                <View style={styles.calendar}>
                  <View style={styles.calendarHeader}>
                    <Pressable
                      disabled={submitting}
                      onPress={() => handleChangeCalendarMonth(-1)}
                      style={styles.calendarNavButton}
                    >
                      <Text style={styles.calendarNavText}>{"<"}</Text>
                    </Pressable>
                    <Text style={styles.calendarTitle}>
                      {MONTH_LABELS[calendarMonth.getUTCMonth()]} {calendarMonth.getUTCFullYear()}
                    </Text>
                    <Pressable
                      disabled={submitting}
                      onPress={() => handleChangeCalendarMonth(1)}
                      style={styles.calendarNavButton}
                    >
                      <Text style={styles.calendarNavText}>{">"}</Text>
                    </Pressable>
                  </View>

                  <View style={styles.weekdaysGrid}>
                    {WEEKDAY_LABELS.map((weekday, index) => (
                      <Text key={`${weekday}-${index}`} style={styles.weekdayText}>
                        {weekday}
                      </Text>
                    ))}
                  </View>

                  <View style={styles.daysGrid}>
                    {calendarDays.map((date, index) => {
                      const isoDate = date ? formatIsoDate(date.toISOString()) : "";
                      const isSelected = isoDate && isoDate === normalizedSelectedDate;

                      return (
                        <Pressable
                          disabled={!date || submitting}
                          key={`${isoDate || "empty"}-${index}`}
                          onPress={() => handleSelectCalendarDate(date)}
                          style={[
                            styles.dayCell,
                            isSelected ? styles.dayCellSelected : null
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              isSelected ? styles.dayTextSelected : null
                            ]}
                          >
                            {date ? date.getUTCDate() : ""}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}
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
  dateInputRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  dateInput: {
    flex: 1
  },
  calendarToggle: {
    alignItems: "center",
    backgroundColor: "#e9f5ee",
    borderColor: "#cfe4d7",
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: 14
  },
  calendarToggleText: {
    color: "#1c7c54",
    fontSize: 14,
    fontWeight: "700"
  },
  calendar: {
    backgroundColor: "#ffffff",
    borderColor: "#d5ddd8",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
    padding: 12
  },
  calendarHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10
  },
  calendarTitle: {
    color: "#112018",
    fontSize: 16,
    fontWeight: "700"
  },
  calendarNavButton: {
    alignItems: "center",
    backgroundColor: "#f2f5f3",
    borderRadius: 10,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  calendarNavText: {
    color: "#203229",
    fontSize: 18,
    fontWeight: "700"
  },
  weekdaysGrid: {
    flexDirection: "row",
    marginBottom: 6
  },
  weekdayText: {
    color: "#516059",
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center"
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  dayCell: {
    alignItems: "center",
    aspectRatio: 1,
    justifyContent: "center",
    width: "14.2857%"
  },
  dayCellSelected: {
    backgroundColor: "#1c7c54",
    borderRadius: 999
  },
  dayText: {
    color: "#203229",
    fontSize: 14,
    fontWeight: "600"
  },
  dayTextSelected: {
    color: "#ffffff"
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
