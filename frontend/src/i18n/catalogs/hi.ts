import { errors } from "./hi/errors";
import { ui } from "./hi/ui";
import { more } from "./hi/more";
import { dynamic } from "./hi/dynamic";
import { base } from "./hi/base";
import { type Catalog } from "../runtime";
export default { ...errors, ...ui, ...more, ...dynamic, ...base } as const satisfies Catalog;
