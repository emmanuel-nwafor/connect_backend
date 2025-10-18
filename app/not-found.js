"use client";
import React from "react";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9fafb",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap");
        body,
        html {
          font-family: "Poppins", sans-serif;
        }
      `}</style>

      <img
        src="https://res.cloudinary.com/dbczfoqnc/image/upload/v1757032861/Home-studio_logo-removebg-preview_gbq77s.png"
        alt="Connect Logo"
        style={{ width: "130px", marginBottom: "1.8rem" }}
      />

      {/* Bouncing Loader */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "1.2rem",
        }}
      >
        {[1, 2, 3].map((dot, index) => (
          <span
            key={index}
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#2563eb",
              animation: `bounce 0.6s ease-in-out ${index * 0.15}s infinite`,
            }}
          ></span>
        ))}
      </div>

      <p style={{ color: "#475569", fontSize: "1rem", fontWeight: "500" }}>
        Loading...
      </p>

      <style jsx>{`
        @keyframes bounce {
          0%,
          80%,
          100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </main>
  );
}
