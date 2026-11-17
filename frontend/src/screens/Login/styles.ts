import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a3d2b",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1b5e3b",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4b5563",
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#1f2937",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2d7a52",
  },
  submitBtn: {
    backgroundColor: "#1b5e3b",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 12,
    color: "#6b7280",
  },
  registerText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#c97d24",
  },
});
