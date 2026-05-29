import { registerRootComponent } from "expo";
import { NavigationContainer } from "@react-navigation/native";

import { AuthProvider } from "./src/contexts/AuthContext";
import AppRoutes from "./src/routes/AppRoutes";

function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppRoutes />
      </NavigationContainer>
    </AuthProvider>
  );
}

registerRootComponent(App);

export default App;
