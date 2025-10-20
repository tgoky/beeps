// Controls.tsx
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "../../providers/ThemeProvider";

interface ControlsProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Controls = ({ collapsed, setCollapsed }: ControlsProps) => {
  const { theme } = useTheme();

  return (
    <div className={`flex items-center justify-between px-3 py-2.5 border-b backdrop-blur-sm ${
      theme === "dark" 
        ? "border-gray-800/50 bg-black" 
        : "border-gray-200/60 bg-white/40"
    }`}>
      {!collapsed && (
        <div className={`text-[11px] font-medium tracking-[0.15em] ${
          theme === "dark" ? "text-gray-500" : "text-gray-600"
        }`}>
          BEEPS
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            theme === "dark"
              ? "hover:bg-gray-800/60 text-gray-500  bg-black border border-gray-700 hover:text-gray-300"
              : "hover:bg-gray-100/80 text-gray-500 bg-gray hover:text-gray-700"
          }`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};