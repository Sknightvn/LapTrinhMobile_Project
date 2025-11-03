import { useRouter } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { favoritesStyles } from "../assets/styles/favorites.styles";

function NoFavoritesFound() {
  const router = useRouter();

  return (
    <View style={favoritesStyles.emptyState}>
      <View style={favoritesStyles.emptyIconContainer}>
        <Ionicons name="heart-outline" size={80} color={COLORS.textLight} />
      </View>
      <Text style={favoritesStyles.emptyTitle}>Chưa có mục yêu thích</Text>
      <TouchableOpacity style={favoritesStyles.exploreButton} onPress={() => router.push("/")}>
        <Ionicons name="search" size={18} color={COLORS.white} />
        <Text style={favoritesStyles.exploreButtonText}>Khám phá các công thức</Text>
      </TouchableOpacity>
    </View>
  );
}

export default NoFavoritesFound;
