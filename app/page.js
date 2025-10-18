
"use client"
import React from "react";

export default function Page() {
  return (
    <main
      style={{
        minHeight: "90vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "3rem 2.5rem",
          textAlign: "center",
          maxWidth: "500px",
          width: "100%",
          transition: "all 0.3s ease-in-out",
        }}
      >
        <img
          src="https://res.cloudinary.com/dbczfoqnc/image/upload/v1757032861/Home-studio_logo-removebg-preview_gbq77s.png"
          alt="Connect Logo"
          style={{
            width: "120px",
            marginBottom: "1.8rem",
            transition: "transform 0.3s ease-in-out",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        />

        <h1
          style={{
            fontSize: "1.8rem",
            fontWeight: "600",
            color: "#0f172a",
            marginBottom: "0.6rem",
          }}
        >
          Welcome to <span style={{ color: "#2563eb" }}>CONNECT</span> Backend
        </h1>

        <p
          style={{
            fontSize: "1rem",
            color: "#475569",
            lineHeight: "1.6",
            marginBottom: "1.5rem",
          }}
        >
          Your backend is live and operational. Everything is connected securely.
        </p>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            backgroundColor: "#2563eb",
            color: "#fff",
            padding: "10px 24px",
            borderRadius: "8px",
            fontWeight: "500",
            fontSize: "0.95rem",
            cursor: "default",
            boxShadow: "0 4px 10px rgba(37,99,235,0.3)",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#22c55e",
              animation: "pulse 1.2s infinite ease-in-out",
            }}
          ></span>
          <span>Server Connected</span>
        </div>
      </div>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap");
        body,
        html {
          font-family: "Poppins", sans-serif;
        }
      `}</style>

      <style jsx>{`
        @keyframes pulse {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.4);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </main>
  );
}
