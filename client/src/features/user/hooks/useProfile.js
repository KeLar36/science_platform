import { useState, useCallback } from "react";
import { useAuth } from "@/shared/lib/context/AuthContext";
import { userApi } from "@/features/user/api/userApi";
import { projectApi } from "@/features/projects/api/projectApi";

export function useProfile() {
  const { user, updateUserState, logout, checkAuth } = useAuth();
  const [savedPosts, setSavedPosts] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    total: 0,
    accepted: 0,
    pending: 0,
    needsRevision: 0,
    rejected: 0,
  });

  const refreshProfile = useCallback(async () => {
    try {
      await checkAuth(true);
    } catch (err) {
      console.error("Помилка оновлення профілю:", err);
    }
  }, [checkAuth]);

  const fetchSavedPosts = useCallback(async () => {
    try {
      setLoadingSaved(true);
      const data = await userApi.getSavedPosts();
      setSavedPosts(data || []);
    } catch (err) {
      console.error("Помилка завантаження збережених постів:", err);
    } finally {
      setLoadingSaved(false);
    }
  }, []);

  const fetchMyProjects = useCallback(async (page = 1) => {
    try {
      setLoadingProjects(true);
      const rawData = await projectApi.getMyProjects({}, page, 8);

      setMyProjects(rawData || []);

      if (rawData?.stats) {
        setStats(rawData.stats);
      } else {
        const projectsArray = Array.isArray(rawData)
          ? rawData
          : rawData?.projects || [];

        setStats({
          total: rawData?.totalItems ?? projectsArray.length,
          accepted: projectsArray.filter((p) => p.status === "Прийнято").length,
          pending: projectsArray.filter(
            (p) => p.status === "На розгляді" || !p.status,
          ).length,
          needsRevision: projectsArray.filter(
            (p) => p.status === "На доопрацюванні",
          ).length,
          rejected: projectsArray.filter((p) => p.status === "Відхилено")
            .length,
        });
      }
    } catch (err) {
      console.error("Помилка завантаження моїх проєктів:", err);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const updateProfile = async (formData) => {
    try {
      setUpdating(true);
      setError(null);
      const updatedUser = await userApi.updateProfile(formData);
      updateUserState(updatedUser);
      return { success: true, data: updatedUser };
    } catch (err) {
      console.error("Помилка оновлення даних профілю:", err);
      const msg = err.response?.data?.message || "Не вдалося оновити дані";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setUpdating(false);
    }
  };

  const toggleBookmark = async (postId) => {
    try {
      const data = await userApi.toggleBookmark(postId);

      if (data?.bookmarks) {
        updateUserState({ ...user, bookmarks: data.bookmarks });
      }

      fetchSavedPosts();
      return { success: true, data };
    } catch (err) {
      console.error("Помилка збереження посту:", err);
      return {
        success: false,
        error: err.response?.data?.message || "Помилка закладок",
      };
    }
  };

  const deleteAccount = async () => {
    try {
      const res = await userApi.deleteAccount();
      await logout();
      return { success: true, message: res?.message };
    } catch (err) {
      return {
        success: false,
        error:
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Не вдалося видалити профіль",
      };
    }
  };

  return {
    user,
    savedPosts,
    myProjects,
    stats,
    loadingSaved,
    loadingProjects,
    updating,
    refreshProfile,
    error,
    fetchSavedPosts,
    fetchMyProjects,
    updateProfile,
    toggleBookmark,
    deleteAccount,
  };
}
