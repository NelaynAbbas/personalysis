import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Pie,
  PieChart,
  Cell,
  Sector,
  Treemap,
  LineChart,
  Line
} from "recharts";
// Mapping trait categories for display
const traitCategories = {
  'openness': 'cognitive',
  'conscientiousness': 'behavioral',
  'extraversion': 'behavioral',
  'agreeableness': 'behavioral',
  'emotional_stability': 'cognitive',
  'financial': 'financial',
  'cognitive': 'cognitive',
  'behavioral': 'behavioral'
};
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import { PersonalityTrait } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip as TooltipUI,
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

// Animation colors
const COLORS = [
  "#4338ca", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f97316", // orange
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#84cc16", // lime
  "#ca8a04", // yellow
  "#475569", // slate
];

interface TraitChartProps {
  traits: { name: string; score?: number; average?: number; category?: string }[];
  animated?: boolean;
  height?: number | string;
  compact?: boolean;
  showTitle?: boolean;
}

const TraitChart = ({ 
  traits, 
  animated = true, 
  height = 400, 
  compact = false,
  showTitle = true
}: TraitChartProps) => {
  const [chartType, setChartType] = useState<string>("bar");
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [animationPercent, setAnimationPercent] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(animated);
  const [hoveredTrait, setHoveredTrait] = useState<string | null>(null);
  
  // Normalize trait data to support both formats (average or score) with defensive programming
  const normalizedTraits = (traits && Array.isArray(traits))
    ? traits
        .filter(trait => trait !== null && trait !== undefined) // Filter out null/undefined traits
        .map(trait => {
          // Default values if trait properties are missing
          const traitName = trait?.name || "Unknown Trait";
          const traitCategory = trait?.category || "cognitive";
          
          // Map the original server categories to our display categories
          const mappedCategory = (traitCategory && traitCategories[traitCategory as keyof typeof traitCategories]) 
            ? traitCategories[traitCategory as keyof typeof traitCategories] 
            : 'cognitive';
            
          return {
            name: traitName,
            score: trait?.score ?? trait?.average ?? 0,
            category: mappedCategory
          };
        })
    : []; // Return empty array if traits is null/undefined or not an array
  
  // Format trait data for the chart
  const chartData = normalizedTraits
    .sort((a, b) => b.score - a.score)
    .slice(0, compact ? 5 : 8) // Show fewer traits in compact mode
    .map(trait => ({
      name: trait.name,
      score: isAnimating ? Math.min(trait.score * (animationPercent / 100), trait.score) : trait.score,
      fullScore: trait.score, // Keep the full score for reference
      category: trait.category
    }));
  
  // Data for radar chart display (all traits, grouped by category)
  const radarData = Object.values(
    normalizedTraits.reduce<Record<string, {category: string, value: number}>>((acc, trait) => {
      const category = trait.category;
      if (!acc[category]) {
        acc[category] = { category, value: 0 };
      }
      acc[category].value += trait.score;
      return acc;
    }, {})
  ).map(item => ({
    category: item.category,
    value: Math.min(item.value / 100, 100),
    fullValue: item.value / 100
  }));
  
  // Run the animation when component mounts
  useEffect(() => {
    if (animated && animationPercent < 100) {
      const timer = setTimeout(() => {
        setAnimationPercent(prev => Math.min(prev + 2, 100));
      }, 20);
      return () => clearTimeout(timer);
    } else if (animationPercent >= 100) {
      setIsAnimating(false);
    }
  }, [animated, animationPercent]);
  
  // For pie chart active animation
  const onPieEnter = useCallback(
    (_: any, index: number) => {
      setActiveIndex(index);
    },
    []
  );
  
  // Render different chart types with empty data handling
  const renderChart = () => {
    // Check if we have data to display
    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full">
          <div className="text-gray-500 text-center">
            <p className="mb-2">No trait data available to display</p>
            <p className="text-sm">Complete a survey to see your personality traits</p>
          </div>
        </div>
      );
    }

    switch (chartType) {
      case "radar":
        // Safety check for radar data
        if (!radarData || radarData.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center h-full w-full">
              <div className="text-gray-500 text-center">
                <p>No category data available for radar chart</p>
              </div>
            </div>
          );
        }
        
        return (
          <RadarChart 
            cx="50%" 
            cy="50%" 
            outerRadius="80%" 
            width={500} 
            height={compact ? 300 : 400} 
            data={radarData}
          >
            <PolarGrid strokeDasharray="3 3" />
            <PolarAngleAxis dataKey="category" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar 
              name="Traits" 
              dataKey={isAnimating ? "value" : "fullValue"} 
              stroke="#8884d8" 
              fill="#8884d8" 
              fillOpacity={0.6} 
              animationDuration={2000}
              animationBegin={0}
              animationEasing="ease-in-out"
            />
            <Tooltip 
              formatter={(value: number) => [`${Math.round(value)}%`, 'Trait Strength']}
              labelFormatter={(label) => `Category: ${label}`}
            />
          </RadarChart>
        );
        
      case "pie":
        return (
          <PieChart width={500} height={compact ? 300 : 400}>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              dataKey="score"
              onMouseEnter={onPieEnter}
              animationDuration={2000}
              animationBegin={0}
              animationEasing="ease-in-out"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${Math.round(value)}%`, 'Score']}
              labelFormatter={(label) => `Trait: ${label}`}
            />
          </PieChart>
        );
        
      case "treemap":
        return (
          <Treemap
            width={500}
            height={compact ? 300 : 400}
            data={chartData}
            dataKey="score"
            nameKey="name"
            aspectRatio={4 / 3}
            stroke="#fff"
            fill="#8884d8"
            animationDuration={2000}
            animationBegin={0}
            animationEasing="ease-in-out"
          >
            <Tooltip 
              formatter={(value: number) => [`${Math.round(value)}%`, 'Score']}
              labelFormatter={(label) => `Trait: ${label}`}
            />
          </Treemap>
        );
        
      default: // bar chart
        return (
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: compact ? 60 : 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={compact ? 110 : 150} 
              tick={(props) => {
                // Safely handle the tick function
                try {
                  const value = props.payload.value;
                  return (
                    <text
                      {...props}
                      fill={hoveredTrait === value ? "#4338ca" : "currentColor"}
                      fontWeight={hoveredTrait === value ? "bold" : "normal"}
                      textAnchor="end"
                      x={props.x - 10}
                      y={props.y + 3}
                    >
                      {value && value.length > 15 ? `${value.substring(0, 15)}...` : value}
                    </text>
                  );
                } catch (e) {
                  return null;
                }
              }}
            />
            <Tooltip 
              formatter={(value: number) => [`${Math.round(value)}%`, 'Score']}
              labelFormatter={(label) => `Trait: ${label}`}
            />
            <Bar 
              dataKey="score" 
              animationDuration={2000}
              animationBegin={0}
              animationEasing="ease-in-out"
              onMouseOver={(data) => {
                if (data && data.name) {
                  setHoveredTrait(data.name)
                }
              }}
              onMouseOut={() => setHoveredTrait(null)}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  strokeWidth={hoveredTrait === entry.name ? 2 : 0}
                  stroke={hoveredTrait === entry.name ? "#000" : "none"}
                />
              ))}
            </Bar>
          </BarChart>
        );
    }
  };
  
  // Active shape rendering for pie chart with defensive programming
  const renderActiveShape = (props: any) => {
    // Return empty group if props are missing or invalid
    if (!props) {
      return <g></g>;
    }
    
    // Safely extract properties with defaults
    const {
      cx = 0,
      cy = 0,
      midAngle = 0,
      innerRadius = 0,
      outerRadius = 0,
      startAngle = 0,
      endAngle = 0,
      fill = "#8884d8",
      percent = 0,
      name = "Unknown",
      score = 0
    } = props;
    
    try {
      const RADIAN = Math.PI / 180;
      const sin = Math.sin(-RADIAN * midAngle);
      const cos = Math.cos(-RADIAN * midAngle);
      const sx = cx + (outerRadius + 10) * cos;
      const sy = cy + (outerRadius + 10) * sin;
      const mx = cx + (outerRadius + 30) * cos;
      const my = cy + (outerRadius + 30) * sin;
      const ex = mx + (cos >= 0 ? 1 : -1) * 22;
      const ey = my;
      const textAnchor = cos >= 0 ? "start" : "end";
    
      return (
        <g>
          <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
            {name || "Unknown"}
          </text>
          <Sector
            cx={cx}
            cy={cy}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
            stroke="#000"
            strokeWidth={2}
          />
          <Sector
            cx={cx}
            cy={cy}
            startAngle={startAngle}
            endAngle={endAngle}
            innerRadius={outerRadius + 6}
            outerRadius={outerRadius + 10}
            fill={fill}
          />
          <path
            d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
            stroke={fill}
            fill="none"
          />
          <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
          <text
            x={ex + (cos >= 0 ? 1 : -1) * 12}
            y={ey}
            textAnchor={textAnchor}
            fill="#333"
          >{`${Math.round(score)}%`}</text>
        </g>
      );
    } catch (error) {
      // Return minimal representation if calculations fail
      return (
        <g>
          <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
            {name || "Unknown"}
          </text>
        </g>
      );
    }
  };
  
  // Function to restart animation
  const handleRestartAnimation = () => {
    setAnimationPercent(0);
    setIsAnimating(true);
  };
  
  return (
    <div className="w-full" style={{ height: typeof height === 'number' ? `${height}px` : height }}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Personality Trait Analysis</h3>
          <div className="flex items-center gap-2">
            {!compact && (
              <div>
                {/* Chart type selection removed as requested */}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="relative w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TraitChart;
