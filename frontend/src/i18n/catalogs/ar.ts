import { errors } from "./ar/errors";
import { ui } from "./ar/ui";
import { more } from "./ar/more";
import { dynamic } from "./ar/dynamic";
import { base } from "./ar/base";
import { type Catalog } from "../runtime";
export default { ...errors, ...ui, ...more, ...dynamic, ...base } as const satisfies Catalog;
