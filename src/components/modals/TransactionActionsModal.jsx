import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function TransactionActionsModal({
  visible,
  onClose,
  onEdit,
  onDelete,
  transaction,
  darkMode = false,
  modalBgClass,
  textPrimary,
  textMuted,
  smallBtnBgClass,
  minorBtnBgClass,
  accentBtnClass,
}) {
  const primaryColor = darkMode ? "#F9FAFB" : "#111827";
  const mutedColor = darkMode ? "#D1D5DB" : "#6B7280";
  const accentColor = darkMode ? "#4F46E5" : "#2563EB";
  const secondaryBg = darkMode ? "#374151" : "#E5E7EB";

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View
          className={`${modalBgClass} w-11/12 max-w-sm rounded-lg p-5`}
          style={[
            styles.card,
            darkMode ? styles.cardDark : styles.cardLight,
            styles.cardShadow,
          ]}
        >
          <Text
            className={`text-lg font-bold mb-2 ${textPrimary}`}
            style={[styles.titleText, { color: primaryColor }]}
          >
            Acciones
          </Text>
          {transaction ? (
            <View style={{ marginBottom: 12 }}>
              <Text
                className={`${textPrimary}`}
                style={{ color: primaryColor, fontWeight: "600" }}
              >
                {transaction.descripcion}
              </Text>
              <Text className={`${textMuted}`} style={{ color: mutedColor }}>
                {transaction.tipo} •{" "}
                {transaction.categoria ||
                  (transaction.tipo === "Ingreso"
                    ? "INGRESO"
                    : "SIN CATEGORIA")}
              </Text>
            </View>
          ) : null}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              className={`${accentBtnClass} px-4 py-2 rounded`}
              onPress={onEdit}
              style={[styles.primaryButton, { backgroundColor: accentColor }]}
            >
              <Text className="text-white" style={styles.primaryButtonText}>
                Editar
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              className={`${smallBtnBgClass} px-4 py-2 rounded`}
              onPress={onDelete}
              style={[styles.secondaryButton, { backgroundColor: secondaryBg }]}
            >
              <Text
                className={textPrimary}
                style={{ color: primaryColor, fontWeight: "600" }}
              >
                Eliminar
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerRow}>
            <TouchableOpacity
              className={`${minorBtnBgClass} px-4 py-2 rounded`}
              onPress={onClose}
              style={[styles.secondaryButton, { backgroundColor: secondaryBg }]}
            >
              <Text
                className={textPrimary}
                style={{ color: primaryColor, fontWeight: "600" }}
              >
                Cerrar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 16,
  },
  card: {
    width: "90%",
    maxWidth: 420,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  cardShadow: {
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  cardLight: {
    backgroundColor: "#ffffff",
  },
  cardDark: {
    backgroundColor: "#111827",
  },
  titleText: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  actionsRow: {
    marginBottom: 8,
  },
  footerRow: {
    marginTop: 8,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  primaryButtonText: {
    fontWeight: "700",
    fontSize: 15,
    color: "#FFFFFF",
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
});
