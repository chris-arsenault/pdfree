import { errors } from "./zh-Hant/errors";
import { ui } from "./zh-Hant/ui";
import { more } from "./zh-Hant/more";
import { dynamic } from "./zh-Hant/dynamic";
import { base } from "./zh-Hant/base";
import { type Catalog } from "../runtime";
export default { ...errors, ...ui, ...more, ...dynamic, ...base } as const satisfies Catalog;
