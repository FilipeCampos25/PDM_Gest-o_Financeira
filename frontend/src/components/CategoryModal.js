import { useEffect, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
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

import { CATEGORY_COLOR_OPTIONS } from "../constants/categoryColors";
import { CATEGORY_ICON_OPTIONS } from "../constants/categoryIcons";

function buildInitialValues(category) {
  return {
    name: category?.name || "",
    displayName: category?.displayName || "",
    icon: category?.icon || CATEGORY_ICON_OPTIONS[0].value,
    background: category?.background || CATEGORY_COLOR_OPTIONS[0].value,
    isIncome: category?.isIncome === true
  };
}

function validateFormValues(values) {
  const nextErrors = {};
  const normalizedName = normalizeInternalName(values.name);
  const normalizedDisplayName = normalizeDisplayText(values.displayName);

  if (!normalizedName) {
    nextErrors.name = "Informe o nome interno.";
  }

  if (!normalizedDisplayName) {
    nextErrors.displayName = "Informe o nome de exibicao.";
  }

  if (!values.icon) {
    nextErrors.icon = "Selecione um icone.";
  }

  if (!values.background) {
    nextErrors.background = "Selecione uma cor.";
  }

  return nextErrors;
}

function normalizeInternalName(value) {
  return value
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeDisplayText(value) {
  return value.replace(/\s+/g, " ").trim();
}

export default function CategoryModal({
  visible = false,
  category = null,
  submitting = false,
  submitError = "",
  onClose,
  onSave
}) {
  const [formValues, setFormValues] = useState(buildInitialValues(category));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!visible) {
      return;
    }

    setFormValues(buildInitialValues(category));
    setErrors({});
  }, [category, visible]);

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
      name: normalizeInternalName(formValues.name),
      displayName: normalizeDisplayText(formValues.displayName),
      icon: formValues.icon,
      background: formValues.background,
      isIncome: formValues.isIncome
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
              {category ? "Editar categoria" : "Nova categoria"}
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

            <View style={styles.preview}>
              <View
                style={[
                  styles.previewIcon,
                  { backgroundColor: formValues.background || "#9aa8a0" }
                ]}
              >
                <MaterialIcons
                  color="#ffffff"
                  name={formValues.icon || "category"}
                  size={24}
                />
              </View>
              <View style={styles.previewTextGroup}>
                <Text style={styles.previewName}>
                  {formValues.displayName || "Nome da categoria"}
                </Text>
                <Text style={styles.previewMeta}>
                  {formValues.isIncome ? "Receita" : "Despesa"}
                </Text>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Nome interno</Text>
              <TextInput
                autoCapitalize="none"
                editable={!submitting}
                onBlur={() =>
                  handleFieldChange("name", normalizeInternalName(formValues.name))
                }
                onChangeText={(value) => handleFieldChange("name", value)}
                placeholder="ex: mercado"
                placeholderTextColor="#7a8480"
                style={[styles.input, errors.name ? styles.inputError : null]}
                value={formValues.name}
              />
              {!!errors.name && <Text style={styles.fieldError}>{errors.name}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Nome de exibicao</Text>
              <TextInput
                editable={!submitting}
                onBlur={() =>
                  handleFieldChange(
                    "displayName",
                    normalizeDisplayText(formValues.displayName)
                  )
                }
                onChangeText={(value) => handleFieldChange("displayName", value)}
                placeholder="Ex: Mercado"
                placeholderTextColor="#7a8480"
                style={[
                  styles.input,
                  errors.displayName ? styles.inputError : null
                ]}
                value={formValues.displayName}
              />
              {!!errors.displayName && (
                <Text style={styles.fieldError}>{errors.displayName}</Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Icone</Text>
              <View
                style={[
                  styles.iconGrid,
                  errors.icon ? styles.inputError : null
                ]}
              >
                {CATEGORY_ICON_OPTIONS.map((iconOption) => {
                  const isSelected = formValues.icon === iconOption.value;

                  return (
                    <Pressable
                      disabled={submitting}
                      key={iconOption.value}
                      onPress={() => handleFieldChange("icon", iconOption.value)}
                      style={({ pressed }) => [
                        styles.iconOption,
                        isSelected ? styles.iconOptionSelected : null,
                        pressed ? styles.buttonPressed : null
                      ]}
                    >
                      <MaterialIcons
                        color={isSelected ? "#1c7c54" : "#203229"}
                        name={iconOption.value}
                        size={20}
                      />
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.iconOptionText,
                          isSelected ? styles.iconOptionTextSelected : null
                        ]}
                      >
                        {iconOption.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {!!errors.icon && <Text style={styles.fieldError}>{errors.icon}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Cor</Text>
              <View
                style={[
                  styles.colorGrid,
                  errors.background ? styles.inputError : null
                ]}
              >
                {CATEGORY_COLOR_OPTIONS.map((colorOption) => {
                  const isSelected = formValues.background === colorOption.value;

                  return (
                    <Pressable
                      disabled={submitting}
                      key={colorOption.value}
                      onPress={() =>
                        handleFieldChange("background", colorOption.value)
                      }
                      style={({ pressed }) => [
                        styles.colorOption,
                        isSelected ? styles.colorOptionSelected : null,
                        pressed ? styles.buttonPressed : null
                      ]}
                    >
                      <View
                        style={[
                          styles.colorSwatch,
                          { backgroundColor: colorOption.value }
                        ]}
                      />
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.colorOptionText,
                          isSelected ? styles.colorOptionTextSelected : null
                        ]}
                      >
                        {colorOption.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {!!errors.background && (
                <Text style={styles.fieldError}>{errors.background}</Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Tipo</Text>
              <View style={styles.typeSelector}>
                <Pressable
                  disabled={submitting}
                  onPress={() => handleFieldChange("isIncome", false)}
                  style={({ pressed }) => [
                    styles.typeOption,
                    !formValues.isIncome ? styles.typeOptionSelected : null,
                    pressed ? styles.buttonPressed : null
                  ]}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      !formValues.isIncome ? styles.typeOptionTextSelected : null
                    ]}
                  >
                    Despesa
                  </Text>
                </Pressable>

                <Pressable
                  disabled={submitting}
                  onPress={() => handleFieldChange("isIncome", true)}
                  style={({ pressed }) => [
                    styles.typeOption,
                    formValues.isIncome ? styles.typeOptionSelected : null,
                    pressed ? styles.buttonPressed : null
                  ]}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      formValues.isIncome ? styles.typeOptionTextSelected : null
                    ]}
                  >
                    Receita
                  </Text>
                </Pressable>
              </View>
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
                disabled={submitting}
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
  preview: {
    alignItems: "center",
    backgroundColor: "#f6f8f7",
    borderColor: "#d5ddd8",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 18,
    padding: 14
  },
  previewIcon: {
    alignItems: "center",
    borderRadius: 18,
    height: 44,
    justifyContent: "center",
    marginRight: 12,
    width: 44
  },
  previewTextGroup: {
    flex: 1
  },
  previewName: {
    color: "#112018",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 3
  },
  previewMeta: {
    color: "#516059",
    fontSize: 13
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
  iconGrid: {
    backgroundColor: "#f6f8f7",
    borderColor: "#d5ddd8",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 8
  },
  iconOption: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e0e7e2",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 10,
    width: "48%"
  },
  iconOptionSelected: {
    backgroundColor: "#e9f5ee",
    borderColor: "#1c7c54"
  },
  iconOptionText: {
    color: "#203229",
    flex: 1,
    fontSize: 13,
    fontWeight: "700"
  },
  iconOptionTextSelected: {
    color: "#1c7c54"
  },
  colorGrid: {
    backgroundColor: "#f6f8f7",
    borderColor: "#d5ddd8",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 8
  },
  colorOption: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e0e7e2",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 42,
    paddingHorizontal: 10,
    width: "48%"
  },
  colorOptionSelected: {
    backgroundColor: "#e9f5ee",
    borderColor: "#1c7c54"
  },
  colorSwatch: {
    borderColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    height: 18,
    marginRight: 8,
    width: 18
  },
  colorOptionText: {
    color: "#203229",
    flex: 1,
    fontSize: 14,
    fontWeight: "700"
  },
  colorOptionTextSelected: {
    color: "#1c7c54"
  },
  typeSelector: {
    backgroundColor: "#f6f8f7",
    borderColor: "#d5ddd8",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 6
  },
  typeOption: {
    alignItems: "center",
    borderRadius: 9,
    flex: 1,
    justifyContent: "center",
    minHeight: 42
  },
  typeOptionSelected: {
    backgroundColor: "#1c7c54"
  },
  typeOptionText: {
    color: "#516059",
    fontSize: 14,
    fontWeight: "700"
  },
  typeOptionTextSelected: {
    color: "#ffffff"
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
