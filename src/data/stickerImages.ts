import type { TierId } from "../types";
import iron from "../assets/stickers/iron.jpg";
import bronze from "../assets/stickers/bronze.jpg";
import silver from "../assets/stickers/silver.jpg";
import gold from "../assets/stickers/gold.jpg";
import platinum from "../assets/stickers/platinum.jpg";
import titan from "../assets/stickers/titan.jpg";
import finisher from "../assets/stickers/finisher.jpg";

/** 各称号（＋完走者=finisher）の実ステッカー画像URL（Vite がハッシュ付きで配信） */
export const stickerImage: Record<TierId | "finisher", string> = {
  iron,
  bronze,
  silver,
  gold,
  platinum,
  titan,
  finisher,
};
