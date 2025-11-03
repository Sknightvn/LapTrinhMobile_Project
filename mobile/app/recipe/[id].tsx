import { View, Text, Alert, ScrollView, TouchableOpacity, Platform, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-expo";
import { API_URL } from "../../constants/api";
import { MealAPI } from "../../services/mealAPI";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Image } from "expo-image";
import AsyncStorage from '@react-native-async-storage/async-storage';

import { recipeDetailStyles } from "../../assets/styles/recipe-detail.styles";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../constants/colors";

import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import YouTubePlayer from '../../components/YouTubePlayer';

const RecipeDetailScreen = () => {
  const { id: recipeId } = useLocalSearchParams();
  const router = useRouter();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [embedError, setEmbedError] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);

  const { user } = useUser();
  const userId = user?.id;

  useEffect(() => {
    const checkIfSaved = async () => {
      try {
        const response = await fetch(`${API_URL}/favorites/${userId}`);
        const favorites = await response.json();
  const isRecipeSaved = favorites.some((fav) => fav.recipeId === parseInt(String(recipeId)));
        setIsSaved(isRecipeSaved);
      } catch (error) {
        console.error("Error checking if recipe is saved:", error);
      }
    };

    const loadRecipeDetail = async () => {
      setLoading(true);
      try {
        const mealData = await MealAPI.getMealById(recipeId);
        if (mealData) {
          const transformedRecipe = MealAPI.transformMealData(mealData);

          const recipeWithVideo = {
            ...transformedRecipe,
            youtubeUrl: mealData.strYoutube || null,
          };

          setRecipe(recipeWithVideo);
        }
      } catch (error) {
        console.error("Error loading recipe detail:", error);
      } finally {
        setLoading(false);
      }
    };

    const loadCompletedSteps = async () => {
      try {
        const key = `completed_steps_${userId}_${recipeId}`;
        const saved = await AsyncStorage.getItem(key);
        if (saved) {
          const steps = JSON.parse(saved);
          setCompletedSteps(steps);
          console.log('Loaded completed steps:', steps);
        }
      } catch (error) {
        console.error("Error loading completed steps:", error);
      }
    };

    checkIfSaved();
    loadRecipeDetail();
    loadCompletedSteps();
    // debug: log youtube URL for troubleshooting
    // (we'll also log when recipe updates below)
  }, [recipeId, userId]);

  useEffect(() => {
    if (recipe) {
      try {
        console.log('[RecipeDetail] youtubeUrl:', recipe.youtubeUrl);
        const id = recipe.youtubeUrl ? (function (u) { try { return (new URL(u)).searchParams.get('v') || u.split('/').filter(Boolean).pop() } catch (e) { const m = String(u).match(/(?:v=|youtu\.be\/|embed\/)([0-9A-Za-z_-]{11})/); return m ? m[1] : null } })(recipe.youtubeUrl) : null;
        console.log('[RecipeDetail] derived ytId:', id);
      } catch (e) {
        console.warn('Failed to log youtube debug info', e);
      }
    }
  }, [recipe]);

useEffect(() => {
  const saveCompletedSteps = async () => {
    if (!userId || !recipeId) return;
    
    try {
      const key = `completed_steps_${userId}_${recipeId}`;
      await AsyncStorage.setItem(key, JSON.stringify(completedSteps));
      console.log('Saved completed steps:', completedSteps);
    } catch (error) {
      console.error("Error saving completed steps:", error);
    }
  };

  saveCompletedSteps();
}, [completedSteps, userId, recipeId]);

  const getYouTubeId = (url) => {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      let id = parsed.searchParams.get("v");
      if (!id) {
        const parts = parsed.pathname.split("/").filter(Boolean);
        id = parts[parts.length - 1];
      }
      if (!id) return null;
      // sometimes the id may include query params; strip them
      return String(id).split('?')[0];
    } catch (err) {
      const m = String(url).match(/(?:v=|youtu\.be\/|embed\/)([0-9A-Za-z_-]{11})/);
      if (m && m[1]) return m[1];
      return null;
    }
  };

  const handleToggleSave = async () => {
    setIsSaving(true);

    try {
      if (isSaved) {
        // remove from favorites
        const response = await fetch(`${API_URL}/favorites/${userId}/${recipeId}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to remove recipe");

        setIsSaved(false);
      } else {
        // add to favorites
        const response = await fetch(`${API_URL}/favorites`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            recipeId: parseInt(String(recipeId)),
            title: recipe?.title ?? '',
            image: recipe?.image ?? '',
            cookTime: recipe?.cookTime ?? '',
            servings: recipe?.servings ?? '',
          }),
        });

        if (!response.ok) throw new Error("Failed to save recipe");
        setIsSaved(true);
      }
    } catch (error) {
      console.error("Error toggling recipe save:", error);
      Alert.alert("Error", `Something went wrong. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStepCompletion = (stepIndex) => {
    setCompletedSteps(prev => {
      if (prev.includes(stepIndex)) {
        const maxCompletedStep = Math.max(...prev);
        if (stepIndex !== maxCompletedStep) {
          Alert.alert(
            "Lỗi",
            "Bạn chỉ có thể bỏ tick bước cuối cùng đã hoàn thành.",
            [{ text: "OK" }]
          );
          return prev;
        }
        return prev.filter(index => index !== stepIndex);
      } else {
        const nextStep = prev.length;
        
        if (stepIndex !== nextStep) {
          Alert.alert(
            "Thực hiện theo thứ tự",
            `Vui lòng hoàn thành Bước ${nextStep + 1} trước.`,
            [{ text: "OK" }]
          );
          return prev;
        }
        
        return [...prev, stepIndex];
      }
    });
  };

  if (loading) return <LoadingSpinner message="Đang tải chi tiết công thức..." />;

  // If API returned no recipe (e.g. mock list doesn't contain this id),
  // avoid reading properties of null and show a friendly message.
  if (!recipe) {
    return (
      <View style={[recipeDetailStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 18, marginBottom: 12 }}>Không tìm thấy công thức</Text>
        <TouchableOpacity onPress={() => (router.canGoBack && router.canGoBack() ? router.back() : router.replace('/'))}>
          <Text style={{ color: COLORS.primary }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={recipeDetailStyles.container}>
      <ScrollView>
        {/* HEADER */}
        <View style={recipeDetailStyles.headerContainer}>
          <View style={recipeDetailStyles.imageContainer}>
            <Image
              source={{ uri: recipe?.image }}
              style={recipeDetailStyles.headerImage}
              contentFit="cover"
            />
          </View>

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.9)"]}
            style={recipeDetailStyles.gradientOverlay}
          />

          <View style={recipeDetailStyles.floatingButtons}>
            <TouchableOpacity
              style={recipeDetailStyles.floatingButton}
              onPress={() => {
                if (router.canGoBack && router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/'); // hoặc router.push('/')
                }
              }}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                recipeDetailStyles.floatingButton,
                { backgroundColor: isSaving ? COLORS.gray : COLORS.primary },
              ]}
              onPress={handleToggleSave}
              disabled={isSaving}
            >
              <Ionicons
                name={isSaving ? "hourglass" : isSaved ? "bookmark" : "bookmark-outline"}
                size={24}
                color={COLORS.white}
              />
            </TouchableOpacity>
          </View>

          {/* Title Section */}
          <View style={recipeDetailStyles.titleSection}>
            <View style={recipeDetailStyles.categoryBadge}>
              <Text style={recipeDetailStyles.categoryText}>{recipe.category}</Text>
            </View>
            <Text style={recipeDetailStyles.recipeTitle}>{recipe.title}</Text>
            {recipe.area && (
              <View style={recipeDetailStyles.locationRow}>
                <Ionicons name="location" size={16} color={COLORS.white} />
                <Text style={recipeDetailStyles.locationText}>Ẩm thực {recipe.area}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={recipeDetailStyles.contentSection}>
          {/* QUICK STATS */}
          <View style={recipeDetailStyles.statsContainer}>
            <View style={recipeDetailStyles.statCard}>
              <LinearGradient
                colors={["#FF6B6B", "#FF8E53"]}
                style={recipeDetailStyles.statIconContainer}
              >
                <Ionicons name="time" size={20} color={COLORS.white} />
              </LinearGradient>
              <Text style={recipeDetailStyles.statValue}>{recipe.cookTime}</Text>
              <Text style={recipeDetailStyles.statLabel}>Thời gian chuẩn bị</Text>
            </View>

            <View style={recipeDetailStyles.statCard}>
              <LinearGradient
                colors={["#4ECDC4", "#44A08D"]}
                style={recipeDetailStyles.statIconContainer}
              >
                <Ionicons name="people" size={20} color={COLORS.white} />
              </LinearGradient>
              <Text style={recipeDetailStyles.statValue}>{recipe.servings}</Text>
              <Text style={recipeDetailStyles.statLabel}>Phần ăn</Text>
            </View>
          </View>

          {(() => {
            const ytId = getYouTubeId(recipe.youtubeUrl);
            
            // Debug
            console.log('YouTube URL:', recipe.youtubeUrl);
            console.log('YouTube ID:', ytId);
            
            if (!ytId) {
              console.log('No YouTube ID found');
              return null;
            }

            const thumbnailUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
            console.log('Thumbnail URL:', thumbnailUrl);

            return (
              <View style={recipeDetailStyles.sectionContainer}>
                <View style={recipeDetailStyles.sectionTitleRow}>
                  <LinearGradient
                    colors={["#FF0000", "#CC0000"]}
                    style={recipeDetailStyles.sectionIcon}
                  >
                    <Ionicons name="play" size={16} color={COLORS.white} />
                  </LinearGradient>
                  <Text style={recipeDetailStyles.sectionTitle}>Video Hướng dẫn</Text>
                </View>

                <TouchableOpacity 
                  onPress={() => {
                    const url = `https://www.youtube.com/watch?v=${ytId}`;
                    console.log('Opening YouTube:', url);
                    Linking.openURL(url);
                  }}
                  style={recipeDetailStyles.videoCard}
                  activeOpacity={0.8}
                >
                  {/* Thumbnail */}
                  <Image
                    source={{ uri: thumbnailUrl }}
                    style={{
                      width: '100%',
                      height: 200,
                      borderRadius: 12,
                      backgroundColor: '#1a1a1a',
                    }}
                    contentFit="cover"
                    onLoad={() => console.log('Thumbnail loaded successfully')}
                    onError={(e) => console.log('Thumbnail error:', e)}
                  />
                  
                  {/* Dark Overlay */}
                  <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    borderRadius: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    {/* Play Button */}
                    <View style={{
                      width: 70,
                      height: 70,
                      borderRadius: 35,
                      backgroundColor: 'rgba(255,0,0,0.95)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.4,
                      shadowRadius: 8,
                      elevation: 8,
                    }}>
                      <Ionicons 
                        name="play" 
                        size={32} 
                        color="#FFFFFF" 
                        style={{ marginLeft: 3 }} 
                      />
                    </View>
                  </View>

                  {/* YouTube Badge */}
                  <View style={{
                    position: 'absolute',
                    right: 12,
                    bottom: 12,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                    <Ionicons name="logo-youtube" size={16} color="#FF0000" />
                    <Text style={{ 
                      color: '#FFFFFF', 
                      fontSize: 12, 
                      fontWeight: '600',
                      marginLeft: 6,
                    }}>
                      Xem trên Youtube
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })()}

          {/* INGREDIENTS SECTION */}
          <View style={recipeDetailStyles.sectionContainer}>
            <View style={recipeDetailStyles.sectionTitleRow}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primary + "80"]}
                style={recipeDetailStyles.sectionIcon}
              >
                <Ionicons name="list" size={16} color={COLORS.white} />
              </LinearGradient>
              <Text style={recipeDetailStyles.sectionTitle}>Nguyên liệu</Text>
              <View style={recipeDetailStyles.countBadge}>
                <Text style={recipeDetailStyles.countText}>{recipe.ingredients.length}</Text>
              </View>
            </View>

            <View style={recipeDetailStyles.ingredientsGrid}>
              {recipe.ingredients.map((ingredient, index) => (
                <View key={index} style={recipeDetailStyles.ingredientCard}>
                  <View style={recipeDetailStyles.ingredientNumber}>
                    <Text style={recipeDetailStyles.ingredientNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={recipeDetailStyles.ingredientText}>{ingredient}</Text>
                  <View style={recipeDetailStyles.ingredientCheck}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.textLight} />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* INSTRUCTIONS SECTION */}
          <View style={recipeDetailStyles.sectionContainer}>
            <View style={recipeDetailStyles.sectionTitleRow}>
              <LinearGradient
                colors={["#9C27B0", "#673AB7"]}
                style={recipeDetailStyles.sectionIcon}
              >
                <Ionicons name="book" size={16} color={COLORS.white} />
              </LinearGradient>
              <Text style={recipeDetailStyles.sectionTitle}>Hướng dẫn</Text>
              <View style={recipeDetailStyles.countBadge}>
                <Text style={recipeDetailStyles.countText}>{recipe.instructions.length}</Text>
              </View>

              {completedSteps.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setCompletedSteps([])}
                  style={{
                    marginLeft: 'auto',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    backgroundColor: '#ef4444',
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                    Reset ({completedSteps.length}/{recipe.instructions.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={{
              width: '100%',
              height: 8,
              backgroundColor: '#e5e7eb',
              borderRadius: 4,
              overflow: 'hidden',
              marginTop: 12,
              marginBottom: 16,
            }}>
              <View style={{
                width: `${(completedSteps.length / recipe.instructions.length) * 100}%`,
                height: '100%',
                backgroundColor: '#10b981',
                borderRadius: 4,
              }} />
            </View>

            <View style={recipeDetailStyles.instructionsContainer}>
              {recipe.instructions.map((instruction, index) => {
                const isCompleted = completedSteps.includes(index);
                const isNextStep = completedSteps.length === index; // Bước tiếp theo
                const isLocked = !isCompleted && !isNextStep; // Các bước sau bị khóa
                
                return (
                  <View 
                    key={index} 
                    style={[
                      recipeDetailStyles.instructionCard,
                      isCompleted && { opacity: 0.7, backgroundColor: '#f0f9ff' },
                      isLocked && { opacity: 0.4, backgroundColor: '#f5f5f5' } // ← THÊM STYLE KHI KHÓA
                    ]}
                  >
                    <LinearGradient
                      colors={
                        isCompleted 
                          ? ["#10b981", "#059669"] 
                          : isNextStep
                          ? [COLORS.primary, COLORS.primary + "CC"]
                          : ["#9ca3af", "#6b7280"] // ← MÀU XÁM KHI KHÓA
                      }
                      style={recipeDetailStyles.stepIndicator}
                    >
                      {isLocked ? (
                        <Ionicons name="lock-closed" size={16} color={COLORS.white} /> // ← ICON KHÓA
                      ) : (
                        <Text style={recipeDetailStyles.stepNumber}>{index + 1}</Text>
                      )}
                    </LinearGradient>
                    
                    <View style={recipeDetailStyles.instructionContent}>
                      <Text 
                        style={[
                          recipeDetailStyles.instructionText,
                          isCompleted && { textDecorationLine: 'line-through', color: '#6b7280' },
                          isLocked && { color: '#9ca3af' } // ← TEXT XÁM KHI KHÓA
                        ]}
                      >
                        {instruction}
                      </Text>
                      
                      <View style={recipeDetailStyles.instructionFooter}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={[
                            recipeDetailStyles.stepLabel,
                            isLocked && { color: '#9ca3af' }
                          ]}>
                            Bước {index + 1}
                          </Text>
                          {isNextStep && !isCompleted && (
                            <View style={{
                              backgroundColor: COLORS.primary,
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 4,
                            }}>
                              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>
                                Tiếp theo
                              </Text>
                            </View>
                          )}
                        </View>
                        
                        <TouchableOpacity 
                          style={[
                            recipeDetailStyles.completeButton,
                            isCompleted && { backgroundColor: '#10b981' },
                            isLocked && { backgroundColor: '#e5e7eb' } // ← NÚT XÁM KHI KHÓA
                          ]}
                          onPress={() => toggleStepCompletion(index)}
                          disabled={isLocked} // ← DISABLE KHI KHÓA
                        >
                          <Ionicons 
                            name={
                              isLocked 
                                ? "lock-closed" 
                                : isCompleted 
                                ? "checkmark-circle" 
                                : "checkmark"
                            }
                            size={16} 
                            color={
                              isLocked 
                                ? '#9ca3af' 
                                : isCompleted 
                                ? COLORS.white 
                                : COLORS.primary
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            style={recipeDetailStyles.primaryButton}
            onPress={handleToggleSave}
            disabled={isSaving}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primary + "CC"]}
              style={recipeDetailStyles.buttonGradient}
            >
              <Ionicons name="heart" size={20} color={COLORS.white} />
              <Text style={recipeDetailStyles.buttonText}>
                {isSaved ? "Xóa khỏi mục Yêu thích" : "Thêm vào mục Yêu thích"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default RecipeDetailScreen;
