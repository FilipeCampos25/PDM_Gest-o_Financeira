import { Modal, StyleSheet, Text, View } from "react-native";

export default function CategoryModal({ visible = false }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container}>
        <Text>Categoria</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
});
