// Saves the weekly menu (the singleton Menu row, id=1).
// Form fields come in as lunch_0..lunch_6 and dinner_0..dinner_4.

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/app/_lib/prisma";

const MenuSchema = z.object({
  lunch: z.array(z.string().max(120)).length(7),
  dinner: z.array(z.string().max(120)).length(5),
});

export type SaveMenuState =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | null;

export async function saveMenu(
  _prev: SaveMenuState,
  formData: FormData,
): Promise<SaveMenuState> {
  const lunch: string[] = [];
  for (let i = 0; i < 7; i++) {
    lunch.push(((formData.get(`lunch_${i}`) as string) ?? "").trim());
  }
  const dinner: string[] = [];
  for (let i = 0; i < 5; i++) {
    dinner.push(((formData.get(`dinner_${i}`) as string) ?? "").trim());
  }
  const parsed = MenuSchema.safeParse({ lunch, dinner });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid menu" };
  }

  await prisma.menu.upsert({
    where: { id: 1 },
    update: { lunch: parsed.data.lunch, dinner: parsed.data.dinner },
    create: { id: 1, lunch: parsed.data.lunch, dinner: parsed.data.dinner },
  });
  revalidatePath("/");
  return { ok: true, message: "Menu saved." };
}
