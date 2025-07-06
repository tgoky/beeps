// components/ThemeToggle.tsx
"use client";

import { useTheme } from "@providers/ThemeProvider";
import { Button } from "antd";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      icon={theme === "light" ? 
        <MoonOutlined className="text-lg" /> : 
        <SunOutlined className="text-lg" />
      }
      onClick={toggleTheme}
      className="flex items-center justify-center w-9 h-9"
      type="text"
      style={{
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
      }}
    />
  );
};