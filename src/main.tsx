import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { App } from "./App";
import { store } from "./app/store";
import { LoginPage } from "./LoginPage";
import "./styles.css";

function RootApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage onSignIn={() => window.location.assign("/app")} onRequestAccount={() => window.location.assign("/app")} onForgotPassword={() => window.location.assign("/app")} />} />
        <Route path="/app" element={<App />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <RootApp />
    </Provider>
  </React.StrictMode>,
);
