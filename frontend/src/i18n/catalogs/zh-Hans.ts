import { errors } from "./zh-Hans/errors";
import { ui } from "./zh-Hans/ui";
import { more } from "./zh-Hans/more";
import { dynamic } from "./zh-Hans/dynamic";
import { base } from "./zh-Hans/base";
import { type Catalog } from "../runtime";
export default { ...errors, ...ui, ...more, ...dynamic, ...base } as const satisfies Catalog;
