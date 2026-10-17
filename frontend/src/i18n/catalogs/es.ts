import { errors } from "./es/errors";
import { ui } from "./es/ui";
import { more } from "./es/more";
import { dynamic } from "./es/dynamic";
import { base } from "./es/base";
import { type Catalog } from "../runtime";

export default { ...errors, ...ui, ...more, ...dynamic, ...base } as const satisfies Catalog;
