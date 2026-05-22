import { StyleSheet, Text, View } from "react-native";

export default function TransactionCard() {
  return (
    <View style={styles.container}>
      <Text>Transação</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16
  }
});
