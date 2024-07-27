import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  if (!localStorage.getItem("userInfo")) {
    return <Navigate to={"/login"} replace />;
  } else {
    return children;
  }
}