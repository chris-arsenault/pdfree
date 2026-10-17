import { errors } from "./fr/errors";
import { ui } from "./fr/ui";
import { more } from "./fr/more";
import { dynamic } from "./fr/dynamic";
import { base } from "./fr/base";
import { type Catalog } from "../runtime";

export default { ...errors, ...ui, ...more, ...dynamic, ...base } as const satisfies Catalog;
