import React from "react";

const ScrollContent = () => {
  const items = [1, 2, 3];

  return (
    <div style={{ width: "100%" }}>
      {items.map((num) => (
        <div
          key={num}
          style={{
            width: "100%",
            height: "100vh",
            backgroundColor: "#ff000084",
            border: "2px solid white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "2rem",
            fontWeight: "bold",
          }}
        >
          {num}
        </div>
      ))}
    </div>
  );
};

export default function MainPage() {
  return <ScrollContent />;
}