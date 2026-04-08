import { Card, CardContent, CardHeader, CardTitle } from "boulder-ui";
import {
  LuEraser,
  LuGalleryVerticalEnd,
  LuHand,
  LuInfo,
  LuPlugZap,
  LuSquare,
  LuSlidersHorizontal,
} from "react-icons/lu";

import { useMapUiStore } from "@/features/map/stores/use-map-ui-store";
import { AppButton } from "@/shared/ui/app-button/app-button";

import "./map-toolbar.css";

export interface MapToolbarProps {
  activePanel: "session" | "layers" | null;
  onOpenConnectors: () => void;
  onOpenPanel: (panel: "session" | "layers") => void;
}

export function MapToolbar({
  activePanel,
  onOpenConnectors,
  onOpenPanel,
}: MapToolbarProps) {
  const activeTool = useMapUiStore((state) => state.activeTool);
  const setActiveTool = useMapUiStore((state) => state.setActiveTool);
  const setSelection = useMapUiStore((state) => state.setSelection);

  return (
    <Card className="map-toolbar" variant="glass">
      <CardContent className="map-toolbar__content">
        <AppButton
          aria-label="Open session panel"
          aria-pressed={activePanel === "session"}
          className="map-toolbar__button"
          onClick={() => onOpenPanel("session")}
          title="Session"
          variant={activePanel === "session" ? "primary" : "secondary"}
        >
          <LuSlidersHorizontal aria-hidden="true" />
        </AppButton>
        <AppButton
          aria-label="Open layers panel"
          aria-pressed={activePanel === "layers"}
          className="map-toolbar__button"
          onClick={() => onOpenPanel("layers")}
          title="Layers"
          variant={activePanel === "layers" ? "primary" : "secondary"}
        >
          <LuGalleryVerticalEnd aria-hidden="true" />
        </AppButton>
        <AppButton
          aria-label="Open data connectors"
          className="map-toolbar__button"
          onClick={onOpenConnectors}
          title="Connectors"
          variant="secondary"
        >
          <LuPlugZap aria-hidden="true" />
        </AppButton>
        <AppButton
          aria-label="Enable area selection tool"
          aria-pressed={activeTool === "bbox"}
          className="map-toolbar__button"
          onClick={() => setActiveTool("bbox")}
          title="Area selection"
          variant={activeTool === "bbox" ? "primary" : "secondary"}
        >
          <LuSquare aria-hidden="true" />
        </AppButton>
        <AppButton
          aria-label="Enable inspect tool"
          aria-pressed={activeTool === "inspect"}
          className="map-toolbar__button"
          onClick={() => setActiveTool("inspect")}
          title="Inspect"
          variant={activeTool === "inspect" ? "primary" : "secondary"}
        >
          <LuInfo aria-hidden="true" />
        </AppButton>
        <AppButton
          aria-label="Enable pan tool"
          aria-pressed={activeTool === "pan"}
          className="map-toolbar__button"
          onClick={() => setActiveTool("pan")}
          title="Pan"
          variant={activeTool === "pan" ? "primary" : "secondary"}
        >
          <LuHand aria-hidden="true" />
        </AppButton>
        <AppButton
          aria-label="Clear current selection"
          className="map-toolbar__button"
          onClick={() => setSelection(null)}
          title="Clear selection"
          variant="ghost"
        >
          <LuEraser aria-hidden="true" />
        </AppButton>
      </CardContent>
    </Card>
  );
}
