import { errors } from "./vi/errors";
import { ui } from "./vi/ui";
import { more } from "./vi/more";
import { dynamic } from "./vi/dynamic";
import { base } from "./vi/base";
import { type Catalog } from "../runtime";
export default { ...errors, ...ui, ...more, ...dynamic, ...base } as const satisfies Catalog;
