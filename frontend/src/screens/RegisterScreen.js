import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { useAuth } from "../contexts/AuthContext";

function validateForm({ name, email, password }) {
  const nextErrors = {};

  if (!name.trim()) {
    nextErrors.name = "Informe seu nome.";
  }

  if (!email.trim()) {
    nextErrors.email = "Informe o email.";
  }

  if (password.length < 6) {
    nextErrors.password = "A senha deve ter no minimo 6 caracteres.";
  }

  return nextErrors;
}

function getRequestErrorMessage(error, fallbackMessage) {
  return error.response?.data?.error || fallbackMessage;
}

function normalizeName(value) {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function RegisterScreen({ navigation }) {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleNameChange(value) {
    setName(value);
    setErrors((currentErrors) => ({
      ...currentErrors,
      name: undefined
    }));
    setSubmitError("");
  }

  function handleEmailChange(value) {
    setEmail(value);
    setErrors((currentErrors) => ({
      ...currentErrors,
      email: undefined
    }));
    setSubmitError("");
  }

  function handlePasswordChange(value) {
    setPassword(value);
    setErrors((currentErrors) => ({
      ...currentErrors,
      password: undefined
    }));
    setSubmitError("");
  }

  async function handleSubmit() {
    const payload = {
      name: normalizeName(name),
      email: email.trim().toLowerCase(),
      password
    };
    const nextErrors = validateForm(payload);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      setSubmitError("");

      await signUp(payload);
    } catch (error) {
      setSubmitError(
        getRequestErrorMessage(error, "Nao foi possivel concluir o cadastro.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>Cadastre-se para acessar o app.</Text>

        {!!submitError && <Text style={styles.submitError}>{submitError}</Text>}

        <View style={styles.field}>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            autoCorrect={false}
            editable={!loading}
            onBlur={() => setName((currentName) => normalizeName(currentName))}
            onChangeText={handleNameChange}
            placeholder="Seu nome"
            placeholderTextColor="#7a8480"
            style={[styles.input, errors.name ? styles.inputError : null]}
            value={name}
          />
          {!!errors.name && <Text style={styles.fieldError}>{errors.name}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            keyboardType="email-address"
            onChangeText={handleEmailChange}
            placeholder="seuemail@dominio.com"
            placeholderTextColor="#7a8480"
            style={[styles.input, errors.email ? styles.inputError : null]}
            value={email}
          />
          {!!errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Senha</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            onChangeText={handlePasswordChange}
            placeholder="Crie uma senha"
            placeholderTextColor="#7a8480"
            secureTextEntry
            style={[styles.input, errors.password ? styles.inputError : null]}
            value={password}
          />
          {!!errors.password && (
            <Text style={styles.fieldError}>{errors.password}</Text>
          )}
        </View>

        <Pressable
          disabled={loading}
          onPress={handleSubmit}
          style={({ pressed }) => [
            styles.primaryButton,
            (pressed || loading) && styles.primaryButtonPressed
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>Cadastrar</Text>
          )}
        </Pressable>

        <Pressable
          disabled={loading}
          onPress={() => navigation.replace("Login")}
          style={styles.secondaryAction}
        >
          <Text style={styles.secondaryActionText}>Ja tenho conta</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef3ef",
    justifyContent: "center",
    padding: 24
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 24,
    shadowColor: "#0f1a14",
    shadowOpacity: 0.08,
    shadowOffset: {
      width: 0,
      height: 8
    },
    shadowRadius: 18,
    elevation: 3
  },
  title: {
    color: "#112018",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8
  },
  subtitle: {
    color: "#516059",
    fontSize: 15,
    marginBottom: 20
  },
  submitError: {
    backgroundColor: "#fdecec",
    borderRadius: 10,
    color: "#b3261e",
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  field: {
    marginBottom: 16
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
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#1c7c54",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 50,
    marginTop: 8
  },
  primaryButtonPressed: {
    opacity: 0.85
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700"
  },
  secondaryAction: {
    alignItems: "center",
    marginTop: 18
  },
  secondaryActionText: {
    color: "#1c7c54",
    fontSize: 15,
    fontWeight: "600"
  }
});
