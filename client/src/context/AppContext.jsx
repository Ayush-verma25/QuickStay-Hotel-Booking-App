// 1. Updated AppContext with better error handling for production
import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { toast } from "react-hot-toast";

// Set the base URL for axios
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const navigate = useNavigate();
  const { user, isLoaded } = useUser(); // Add isLoaded to check if Clerk is ready
  const { getToken, isLoaded: authLoaded } = useAuth();

  const [isOwner, setIsOwner] = useState(false);
  const [showHotelReg, setShowHotelReg] = useState(false);
  const [searchedCities, setSearchedCities] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    try {
      const { data } = await axios.get("/api/rooms");
      if (data.success) {
        setRooms(data.rooms);
      } else {
        console.error("Failed to fetch rooms:", data.message);
        // Don't show toast for rooms fetch failure on initial load
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      // Only show toast if it's not a network/server error on initial load
      if (error.response?.status !== 500) {
        toast.error("Failed to load rooms");
      }
    }
  };

  const fetchUser = async () => {
    try {
      // Wait for Clerk to be ready and user to be available
      if (!isLoaded || !authLoaded || !user) {
        console.log("Clerk not ready or user not available");
        setLoading(false);
        return;
      }

      const token = await getToken();
      console.log("Token obtained:", token ? "Present" : "Missing");

      if (!token) {
        console.log("No token available, user not authenticated");
        setLoading(false);
        return;
      }

      const { data } = await axios.get("/api/user", {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (data.success) {
        setIsOwner(data.role === "hotelOwner");
        setSearchedCities(data.recentSearchedCities || []);
        console.log("User data fetched successfully");
      } else {
        console.log("Failed to fetch user data:", data.message);
        // Only retry if it's not an auth error
        if (data.message !== "Not authenticated") {
          setTimeout(() => {
            fetchUser();
          }, 5000);
        }
      }
    } catch (error) {
      console.log("Error fetching user:", error);
      
      // Handle different error types
      if (error.response?.status === 401) {
        console.log("Authentication failed, user needs to login");
        // Don't show toast for auth errors on initial load
      } else if (error.code === 'ERR_NETWORK') {
        console.log("Network error, retrying...");
        setTimeout(() => {
          fetchUser();
        }, 10000); // Retry after 10 seconds for network errors
      } else {
        // Only show toast for unexpected errors
        toast.error("Failed to fetch user data");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch rooms on component mount
  useEffect(() => {
    fetchRooms();
  }, []);

  // Fetch user data when Clerk is ready and user is available
  useEffect(() => {
    if (isLoaded && authLoaded) {
      fetchUser();
    }
  }, [user, isLoaded, authLoaded]);

  // Helper function to check authentication
  const isUserAuthenticated = async () => {
    if (!user || !isLoaded || !authLoaded) return false;
    try {
      const token = await getToken();
      return !!token;
    } catch {
      return false;
    }
  };

  const value = {
    currency,
    navigate,
    user,
    getToken,
    isOwner,
    setIsOwner,
    axios,
    showHotelReg,
    setShowHotelReg,
    searchedCities,
    setSearchedCities,
    rooms,
    setRooms,
    isUserAuthenticated,
    loading,
    isLoaded,
    authLoaded,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);