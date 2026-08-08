import React, { useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { useParams } from "react-router-dom";

const Loader = () => {
  const { navigate } = useAppContext();
  const { nexUrl } = useParams();

  useEffect(() => {
    if (nexUrl) {
      setTimeout(() => {
        navigate(`/${nexUrl}`);
      }, 8000);
    }
  }, [nexUrl]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-24 w-24 border-4 border-gray-300 border-t-primary"></div>
    </div>
  );
};

export default Loader;
