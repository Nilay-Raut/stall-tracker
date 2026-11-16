import type { Phrases } from "../translate";
import { add } from "./add";
import { auth } from "./auth";
import { calendar } from "./calendar";
import { close } from "./close";
import { common } from "./common";
import { errors } from "./errors";
import { items } from "./items";
import { reports } from "./reports";
import { setup } from "./setup";
import { target } from "./target";
import { today } from "./today";

/**
 * Every translation, one file per area of the app. English is the key. Hindi and Marathi
 * should be checked by a native speaker before release; keep them short, like the English.
 */
export const PHRASES: Phrases[] = [
  common,
  today,
  add,
  close,
  calendar,
  reports,
  target,
  setup,
  items,
  auth,
  errors,
];
