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

function buildInitialValues(category) {
  return {
    name: category?.name || "",
    displayName: category?.displayName || "",
    icon: category?.icon || "",
    background: category?.background || "",
    isIncome: category?.isIncome === true
  };
}

function validateFormValues(values) {
  const nextErrors = {};

  if (!values.name.trim()) {
    nextErrors.name = "Informe o nome interno.";
  }

  if (!values.displayName.trim()) {
    nextErrors.displayName = "Informe o nome de exibicao.";
  }

  if (!values.icon.trim()) {
    nextErrors.icon = "Informe um icone.";
  }

  if (!values.background.trim()) {
    nextErrors.background = "Informe uma cor de fundo.";
  }

  return nextErrors;
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
      name: formValues.name.trim(),
      displayName: formValues.displayName.trim(),
      icon: formValues.icon.trim(),
      background: formValues.background.trim(),
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
                <Text style={styles.previewIconText}>{formValues.icon || "?"}</Text>
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
              <TextInput
                editable={!submitting}
                onChangeText={(value) => handleFieldChange("icon", value)}
                placeholder="Ex: cart"
                placeholderTextColor="#7a8480"
                style={[styles.input, errors.icon ? styles.inputError : null]}
                value={formValues.icon}
              />
              {!!errors.icon && <Text style={styles.fieldError}>{errors.icon}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Background</Text>
              <TextInput
                autoCapitalize="none"
                editable={!submitting}
                onChangeText={(value) => handleFieldChange("background", value)}
                placeholder="#1c7c54"
                placeholderTextColor="#7a8480"
                style={[
                  styles.input,
                  errors.background ? styles.inputError : null
                ]}
                value={formValues.background}
              />
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
  previewIconText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800"
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
