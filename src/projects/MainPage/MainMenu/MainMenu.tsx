import React from "react";
import { NavLink } from "react-router-dom";

interface MenuItem {
  name: string;
  path: string;
}

const menuItems: MenuItem[] = [
  { name: "Home", path: "/" },
  { name: "Dashboard", path: "/dashboard" },
  { name: "Profile", path: "/profile" },
  { name: "Components", path: "/Stack/NodeJS/React/Components" },
  { name: "Settings", path: "/settings" },
];

const MainMenu: React.FC = () => {
  return (
    <nav style={{ display: "flex", flexDirection: "column", width: "200px" }}>
      {menuItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          style={({ isActive }) => ({
            padding: "10px 15px",
            textDecoration: "none",
            color: isActive ? "white" : "black",
            backgroundColor: isActive ? "#007bff" : "transparent",
            borderRadius: "4px",
            marginBottom: "5px",
          })}
        >
          {item.name}
        </NavLink>
      ))}
    </nav>
  );
};

export default MainMenu;